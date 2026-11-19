//! Funciones de red bajo demanda del usuario (importar enlaces, buscar carátulas/letras,
//! resolver audio local con yt-dlp) y exportación con etiquetas incrustadas (lofty).
//! Nunca hay llamadas automáticas en segundo plano ni telemetría.

use base64::{engine::general_purpose::STANDARD, Engine as _};
use lofty::{
    config::WriteOptions,
    picture::{MimeType, Picture, PictureType},
    prelude::*,
    read_from_path,
    tag::{ItemKey, Tag},
};
use serde::Serialize;
use serde_json::Value;
use std::{
    collections::hash_map::DefaultHasher,
    fs,
    hash::{Hash, Hasher},
    io::{Read, Write},
    path::{Path, PathBuf},
    process::Command,
    time::Duration,
};
use tauri::Emitter;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const UA: &str = "Alify/0.1 (reproductor local; contacto: github.com/alify)";

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout(Duration::from_secs(18))
        .user_agent(UA)
        .build()
}

async fn blocking<T: Send + 'static>(f: impl FnOnce() -> Result<T, String> + Send + 'static) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(f).await.map_err(|e| e.to_string())?
}

fn app_data_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    if let Some(base) = std::env::var_os("LOCALAPPDATA") {
        return PathBuf::from(base).join("Alify");
    }
    std::env::temp_dir().join("Alify")
}

fn covers_dir() -> PathBuf {
    let d = app_data_dir().join("covers");
    let _ = fs::create_dir_all(&d);
    d
}

fn bin_dir() -> PathBuf {
    let d = app_data_dir().join("bin");
    let _ = fs::create_dir_all(&d);
    d
}

fn music_alify_dir() -> PathBuf {
    let base = std::env::var_os("USERPROFILE")
        .or_else(|| std::env::var_os("HOME"))
        .map(PathBuf::from)
        .unwrap_or_else(app_data_dir);
    let d = base.join("Music").join("Alify");
    let _ = fs::create_dir_all(&d);
    d
}

fn clean_filename(s: &str) -> String {
    let c: String = s
        .chars()
        .map(|ch| if "<>:\"/\\|?*".contains(ch) { '_' } else { ch })
        .collect();
    let trimmed = c.trim();
    if trimmed.is_empty() { "track".into() } else { trimmed.to_string() }
}

fn hash_key(s: &str) -> String {
    let mut h = DefaultHasher::new();
    s.hash(&mut h);
    format!("{:016x}", h.finish())
}

// ---------- caché de carátulas ----------
fn download_bytes(url: &str) -> Option<(Vec<u8>, String)> {
    let r = agent().get(url).call().ok()?;
    let mime = r.content_type().to_string();
    let mut buf = Vec::new();
    r.into_reader().take(8_000_000).read_to_end(&mut buf).ok()?;
    if buf.is_empty() {
        return None;
    }
    let mime = if mime.starts_with("image/") { mime } else { "image/jpeg".to_string() };
    Some((buf, mime))
}

fn itunes_cover_url(title: &str, artist: &str) -> Option<String> {
    let term = format!("{} {}", artist, title).trim().to_string();
    if term.is_empty() {
        return None;
    }
    let v: Value = agent()
        .get("https://itunes.apple.com/search")
        .query("term", &term)
        .query("entity", "song")
        .query("limit", "1")
        .call()
        .ok()?
        .into_json()
        .ok()?;
    let art = v["results"].get(0)?["artworkUrl100"].as_str()?;
    Some(art.replace("100x100bb", "1200x1200bb"))
}

fn upgrade_cover_quality(url: &str) -> String {
    // Spotify DOM suele dar miniaturas 64px (4851) o 300px (1e02); b273 es 640px HD
    if url.contains("ab67616d00004851") {
        return url.replace("ab67616d00004851", "ab67616d0000b273");
    }
    if url.contains("ab67616d00001e02") {
        return url.replace("ab67616d00001e02", "ab67616d0000b273");
    }
    // YouTube Music suele dar =w60-h60 o =w120-h120; subir a 1200x1200 HD
    if url.contains("googleusercontent.com") {
        if let Some(idx) = url.find("=w") {
            return format!("{}=w1200-h1200-l90-rj", &url[..idx]);
        }
    }
    // SoundCloud: -t50x50 / -t120x120 / -t200x200 / -large -> -t500x500 HD
    if url.contains("sndcdn.com") {
        for pat in ["-t50x50.", "-t120x120.", "-t200x200.", "-t300x300.", "-large.", "-badge."] {
            if url.contains(pat) {
                return url.replace(pat, "-t500x500.");
            }
        }
    }
    // Deezer: /56x56- o /250x250- -> /1000x1000-
    if url.contains("dzcdn.net") {
        for pat in ["/56x56-", "/120x120-", "/250x250-", "/500x500-"] {
            if url.contains(pat) {
                return url.replace(pat, "/1000x1000-");
            }
        }
    }
    // Apple Music: /60x60bb / /100x100bb -> /1000x1000bb
    if url.contains("mzstatic.com") {
        for pat in ["40x40bb", "60x60bb", "100x100bb", "120x120bb", "300x300bb"] {
            if url.contains(pat) {
                return url.replace(pat, "1000x1000bb");
            }
        }
    }
    // Tidal: /80x80.jpg / /160x160.jpg -> /640x640.jpg
    if url.contains("tidal.com") {
        for pat in ["/80x80.jpg", "/160x160.jpg", "/320x320.jpg"] {
            if url.contains(pat) {
                return url.replace(pat, "/640x640.jpg");
            }
        }
    }
    url.to_string()
}

fn cover_archive_bytes(title: &str, artist: &str, album: &str) -> Option<(Vec<u8>, String)> {
    let a = agent();
    let esc = |s: &str| s.replace('"', " ");
    let by_release = !album.trim().is_empty();
    let (url, key, q) = if by_release {
        (
            "https://musicbrainz.org/ws/2/release/",
            "releases",
            format!("release:\"{}\" AND artist:\"{}\"", esc(album), esc(artist)),
        )
    } else {
        (
            "https://musicbrainz.org/ws/2/recording/",
            "recordings",
            format!("recording:\"{}\" AND artist:\"{}\"", esc(title), esc(artist)),
        )
    };
    let v: Value = a.get(url).query("query", &q).query("fmt", "json").query("limit", "4").call().ok()?.into_json().ok()?;
    let empty = Vec::new();
    let mut ids = Vec::new();
    for item in v[key].as_array().unwrap_or(&empty) {
        if by_release {
            if let Some(id) = item["id"].as_str() {
                ids.push(id.to_string());
            }
        } else if let Some(rels) = item["releases"].as_array() {
            for r in rels {
                if let Some(id) = r["id"].as_str() {
                    ids.push(id.to_string());
                }
            }
        }
    }
    for id in ids.into_iter().take(4) {
        if let Some(res) = download_bytes(&format!("https://coverartarchive.org/release/{id}/front-1200"))
            .or_else(|| download_bytes(&format!("https://coverartarchive.org/release/{id}/front-500")))
        {
            return Some(res);
        }
    }
    None
}

fn cache_cover_for(title: &str, artist: &str, album: &str, hint_url: Option<&str>) -> Option<(PathBuf, Vec<u8>, String)> {
    let upgraded_hint = hint_url.filter(|u| !u.trim().is_empty()).map(upgrade_cover_quality);
    let key = hash_key(&format!("{}|{}|{}|hd", artist.to_lowercase(), title.to_lowercase(), upgraded_hint.as_deref().unwrap_or("")));
    let jpg = covers_dir().join(format!("{key}.jpg"));
    if jpg.is_file() {
        if let Ok(data) = fs::read(&jpg) {
            return Some((jpg, data, "image/jpeg".into()));
        }
    }
    let resolved = upgraded_hint
        .as_deref()
        .and_then(download_bytes)
        .or_else(|| itunes_cover_url(title, artist).and_then(|u| download_bytes(&u)))
        .or_else(|| cover_archive_bytes(title, artist, album));

    if let Some((bytes, mime)) = resolved {
        let ext = if mime.contains("png") { "png" } else { "jpg" };
        let path = covers_dir().join(format!("{key}.{ext}"));
        let _ = fs::write(&path, &bytes);
        return Some((path, bytes, mime));
    }
    None
}

// ---------- enlaces públicos de playlist (Spotify / YouTube) ----------
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WantedOut {
    title: String,
    artist: String,
    cover_url: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LinkPlaylist {
    name: String,
    cover_url: Option<String>,
    tracks: Vec<WantedOut>,
}

fn extract_og_image(html: &str) -> Option<String> {
    for pat in ["property=\"og:image\" content=\"", "content=\"", "og:image"] {
        if pat == "og:image" {
            continue;
        }
        if let Some(pos) = html.find(pat) {
            if pat == "content=\"" && !html[pos.saturating_sub(40)..pos].contains("og:image") {
                continue;
            }
            let rest = &html[pos + pat.len()..];
            if let Some(end) = rest.find('"') {
                let u = &rest[..end];
                if u.starts_with("http") {
                    return Some(u.to_string());
                }
            }
        }
    }
    None
}

fn fetch_spotify_link(u: &str) -> Result<LinkPlaylist, String> {
    let path = u.split("open.spotify.com/").nth(1).unwrap_or("");
    let segs: Vec<&str> = path.split(|c| c == '/' || c == '?').filter(|s| !s.is_empty()).collect();
    let pos = segs
        .iter()
        .position(|s| *s == "playlist" || *s == "album")
        .ok_or("El enlace debe ser de una playlist o álbum de Spotify")?;
    let id = segs.get(pos + 1).ok_or("Enlace incompleto")?;
    let page = agent()
        .get(&format!("https://open.spotify.com/embed/{}/{}", segs[pos], id))
        .call()
        .map_err(|e| format!("No se pudo leer el enlace (¿es público?): {e}"))?
        .into_string()
        .map_err(|e| e.to_string())?;
    let og_cover = extract_og_image(&page);
    let id_pos = page.find("id=\"__NEXT_DATA__\"").ok_or("Spotify cambió su formato; usa CSV/TXT")?;
    let start = page[id_pos..].find('>').ok_or("Script __NEXT_DATA__ inválido")? + id_pos + 1;
    let end = page[start..].find("</script>").ok_or("Respuesta incompleta")? + start;
    let v: Value = serde_json::from_str(&page[start..end]).map_err(|e| e.to_string())?;
    let entity = if v["props"]["pageProps"]["state"]["data"]["entity"].is_object() {
        &v["props"]["pageProps"]["state"]["data"]["entity"]
    } else {
        &v["props"]["pageProps"]["entity"]
    };
    let name = entity["name"]
        .as_str()
        .or_else(|| entity["title"].as_str())
        .unwrap_or("Playlist de Spotify")
        .to_string();
    let entity_cover = entity["coverArt"]["sources"]
        .as_array()
        .and_then(|a| a.first())
        .and_then(|s| s["url"].as_str())
        .or_else(|| entity["visualIdentity"]["image"].as_array().and_then(|a| a.first()).and_then(|s| s["url"].as_str()))
        .map(|s| s.to_string())
        .or(og_cover);
    let list = entity["trackList"]
        .as_array()
        .or_else(|| entity["tracks"]["items"].as_array())
        .ok_or("No se encontraron pistas (¿playlist privada?)")?;
    let tracks = list
        .iter()
        .filter_map(|t| {
            let title = t["title"].as_str().or_else(|| t["name"].as_str())?.trim().to_string();
            let artist = t["subtitle"]
                .as_str()
                .map(|s| s.replace('\u{a0}', " "))
                .or_else(|| {
                    t["artists"]
                        .as_array()
                        .and_then(|a| a.first())
                        .and_then(|x| x["name"].as_str())
                        .map(|s| s.to_string())
                })
                .unwrap_or_default();
            let cover_url = t["coverArt"]["sources"]
                .as_array()
                .and_then(|a| a.first())
                .and_then(|s| s["url"].as_str())
                .map(|s| s.to_string())
                .or_else(|| entity_cover.clone());
            Some(WantedOut { title, artist, cover_url })
        })
        .collect();
    Ok(LinkPlaylist { name, cover_url: entity_cover, tracks })
}

fn fetch_youtube_link(u: &str) -> Result<LinkPlaylist, String> {
    let page = agent()
        .get(u)
        .call()
        .map_err(|e| format!("No se pudo leer la playlist de YouTube: {e}"))?
        .into_string()
        .map_err(|e| e.to_string())?;
    let og_cover = extract_og_image(&page);
    let marker = "var ytInitialData = ";
    let start = page.find(marker).ok_or("No se pudieron leer las pistas de YouTube")? + marker.len();
    let end = page[start..].find(";</script>").ok_or("Respuesta incompleta de YouTube")? + start;
    let v: Value = serde_json::from_str(&page[start..end]).map_err(|e| e.to_string())?;
    let name = v["metadata"]["playlistMetadataRenderer"]["title"]
        .as_str()
        .unwrap_or("Playlist de YouTube")
        .to_string();
    let mut tracks = Vec::new();
    let tabs = &v["contents"]["twoColumnBrowseResultsRenderer"]["tabs"];
    if let Some(arr) = tabs.as_array() {
        for tab in arr {
            let contents = &tab["tabRenderer"]["content"]["sectionListRenderer"]["contents"];
            if let Some(secs) = contents.as_array() {
                for sec in secs {
                    let items = &sec["itemSectionRenderer"]["contents"][0]["playlistVideoListRenderer"]["contents"];
                    if let Some(vids) = items.as_array() {
                        for item in vids {
                            let r = &item["playlistVideoRenderer"];
                            if let Some(title) = r["title"]["runs"][0]["text"].as_str() {
                                let artist = r["shortBylineText"]["runs"][0]["text"].as_str().unwrap_or("").to_string();
                                let thumb = r["thumbnail"]["thumbnails"].as_array().and_then(|t| t.last()).and_then(|x| x["url"].as_str()).map(|s| s.to_string());
                                tracks.push(WantedOut {
                                    title: title.to_string(),
                                    artist,
                                    cover_url: thumb.or_else(|| og_cover.clone()),
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    if tracks.is_empty() {
        return Err("No se encontraron pistas públicas en la playlist de YouTube".into());
    }
    Ok(LinkPlaylist { name, cover_url: og_cover, tracks })
}

fn fetch_via_ytdlp_flat(u: &str) -> Result<LinkPlaylist, String> {
    let ytdlp = ensure_yt_dlp()?;
    let mut cmd = Command::new(&ytdlp);
    cmd.args(["--flat-playlist", "--no-warnings", "-J", u]);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x0800_0000);
    let out = cmd.output().map_err(|e| format!("Error leyendo enlace con yt-dlp: {e}"))?;
    if !out.status.success() {
        return Err("No se pudo leer el enlace público. Verifica que la playlist sea pública.".into());
    }
    let v: Value = serde_json::from_slice(&out.stdout).map_err(|e| e.to_string())?;
    let name = v["title"].as_str().unwrap_or("Playlist importada").to_string();
    let cover_url = v["thumbnails"]
        .as_array()
        .and_then(|a| a.last())
        .and_then(|t| t["url"].as_str())
        .map(|s| s.to_string());
    let mut tracks = Vec::new();
    if let Some(entries) = v["entries"].as_array() {
        for e in entries {
            if let Some(title) = e["title"].as_str() {
                let artist = e["uploader"]
                    .as_str()
                    .or_else(|| e["channel"].as_str())
                    .or_else(|| e["artist"].as_str())
                    .unwrap_or("")
                    .to_string();
                let thumb = e["thumbnails"]
                    .as_array()
                    .and_then(|a| a.last())
                    .and_then(|t| t["url"].as_str())
                    .map(|s| s.to_string())
                    .or_else(|| cover_url.clone());
                tracks.push(WantedOut { title: title.to_string(), artist, cover_url: thumb });
            }
        }
    }
    if tracks.is_empty() {
        return Err("No se encontraron canciones en el enlace.".into());
    }
    Ok(LinkPlaylist { name, cover_url, tracks })
}

#[tauri::command]
pub async fn fetch_playlist_link(url: String) -> Result<LinkPlaylist, String> {
    blocking(move || {
        let u = url.trim();
        if u.contains("open.spotify.com") {
            fetch_spotify_link(u)
        } else if u.contains("youtube.com/playlist") || u.contains("music.youtube.com/playlist") {
            fetch_youtube_link(u).or_else(|_| fetch_via_ytdlp_flat(u))
        } else {
            fetch_via_ytdlp_flat(u)
        }
    })
    .await
}

// ---------- letra (LRCLIB) ----------
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LyricsOut {
    synced: bool,
    text: String,
}

fn pick_lyrics(v: &Value) -> Option<LyricsOut> {
    if let Some(s) = v["syncedLyrics"].as_str().filter(|s| !s.trim().is_empty()) {
        return Some(LyricsOut { synced: true, text: s.to_string() });
    }
    v["plainLyrics"]
        .as_str()
        .filter(|s| !s.trim().is_empty())
        .map(|s| LyricsOut { synced: false, text: s.to_string() })
}

fn clean_for_lyrics(s: &str) -> String {
    let mut out = s.to_string();
    for sep in [" | ", " // ", " [", " (Official", " (official", " (Lyric", " (lyric", " (Audio", " (audio", " (Video", " (video", " (feat.", " (ft."] {
        if let Some(idx) = out.find(sep) {
            out.truncate(idx);
        }
    }
    out.replace(" - Topic", "").trim().to_string()
}

fn query_lrclib(title: &str, artist: &str, album: &str, duration: f64) -> Result<LyricsOut, String> {
    let a = agent();
    let ct = clean_for_lyrics(title);
    let ca = clean_for_lyrics(artist.split(',').next().unwrap_or(artist));
    let mut req = a
        .get("https://lrclib.net/api/get")
        .query("track_name", &ct)
        .query("artist_name", &ca);
    if !album.is_empty() {
        req = req.query("album_name", album);
    }
    if duration > 0.0 {
        req = req.query("duration", &format!("{}", duration.round() as i64));
    }
    if let Ok(r) = req.call() {
        if let Ok(v) = r.into_json::<Value>() {
            if let Some(l) = pick_lyrics(&v) {
                return Ok(l);
            }
        }
    }
    if let Ok(r) = a
        .get("https://lrclib.net/api/search")
        .query("track_name", &ct)
        .query("artist_name", &ca)
        .call()
    {
        if let Ok(v) = r.into_json::<Value>() {
            if let Some(l) = v.as_array().and_then(|arr| arr.iter().find_map(pick_lyrics)) {
                return Ok(l);
            }
        }
    }
    let q = format!("{ca} {ct}").trim().to_string();
    let r = a
        .get("https://lrclib.net/api/search")
        .query("q", &q)
        .call()
        .map_err(|e| format!("LRCLIB no respondió: {e}"))?;
    let v: Value = r.into_json().map_err(|e| e.to_string())?;
    v.as_array()
        .and_then(|arr| arr.iter().find_map(pick_lyrics))
        .ok_or_else(|| "No se encontró letra en LRCLIB".to_string())
}

#[tauri::command]
pub async fn search_lyrics(title: String, artist: String, album: String, duration: f64) -> Result<LyricsOut, String> {
    blocking(move || query_lrclib(&title, &artist, &album, duration)).await
}

#[tauri::command]
pub async fn fetch_synced_lyrics(
    title: String,
    artist: String,
    duration: Option<u32>,
    audio_path: Option<String>,
) -> Result<LyricsOut, String> {
    blocking(move || {
        let res = query_lrclib(&title, &artist, "", duration.unwrap_or(0) as f64)?;
        if let Some(ap) = audio_path.filter(|p| !p.trim().is_empty()) {
            let lrc_path = Path::new(&ap).with_extension("lrc");
            let _ = fs::write(lrc_path, &res.text);
        }
        Ok(res)
    })
    .await
}

// ---------- carátula (iTunes 600x600 + Cover Art Archive + caché local) ----------
#[tauri::command]
pub async fn search_cover(title: String, artist: String, album: String) -> Result<String, String> {
    blocking(move || {
        let (_, bytes, mime) = cache_cover_for(&title, &artist, &album, None)
            .ok_or_else(|| "No se encontró carátula en iTunes ni Cover Art Archive".to_string())?;
        Ok(format!("data:{};base64,{}", mime, STANDARD.encode(bytes)))
    })
    .await
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnrichedWanted {
    cover_path: Option<String>,
    cover_data: Option<String>,
    lyrics: Option<String>,
}

#[tauri::command]
pub async fn enrich_wanted_track(
    title: String,
    artist: String,
    cover_url: Option<String>,
) -> Result<EnrichedWanted, String> {
    blocking(move || {
        let cov = cache_cover_for(&title, &artist, "", cover_url.as_deref());
        let (cover_path, cover_data) = match cov {
            Some((p, bytes, mime)) => (
                Some(p.to_string_lossy().to_string()),
                Some(format!("data:{};base64,{}", mime, STANDARD.encode(bytes))),
            ),
            None => (None, None),
        };
        let lyrics = query_lrclib(&title, &artist, "", 0.0).ok().map(|l| l.text);
        Ok(EnrichedWanted { cover_path, cover_data, lyrics })
    })
    .await
}

// ---------- puente local yt-dlp para resolver pistas faltantes ----------
#[cfg(target_arch = "x86")]
const YT_DLP_EXE: &str = "yt-dlp_x86.exe";
#[cfg(not(target_arch = "x86"))]
const YT_DLP_EXE: &str = "yt-dlp.exe";

fn find_yt_dlp() -> Option<PathBuf> {
    let local = bin_dir().join(YT_DLP_EXE);
    if local.is_file() {
        return Some(local);
    }
    let mut cmd = Command::new("where");
    cmd.arg("yt-dlp");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x0800_0000);
    let check = cmd.output().ok().filter(|o| o.status.success());
    if check.is_some() {
        return Some(PathBuf::from("yt-dlp"));
    }
    None
}

fn download_yt_dlp_sync() -> Result<PathBuf, String> {
    let dest = bin_dir().join(YT_DLP_EXE);
    let tmp = dest.with_extension("exe.tmp");
    let resp = agent()
        .get(&format!("https://github.com/yt-dlp/yt-dlp/releases/latest/download/{YT_DLP_EXE}"))
        .call()
        .map_err(|e| format!("No se pudo descargar yt-dlp: {e}"))?;
    let mut out = fs::File::create(&tmp).map_err(|e| e.to_string())?;
    let mut reader = resp.into_reader();
    std::io::copy(&mut reader, &mut out).map_err(|e| e.to_string())?;
    out.flush().map_err(|e| e.to_string())?;
    drop(out);
    fs::rename(&tmp, &dest).map_err(|e| e.to_string())?;
    Ok(dest)
}

fn ensure_yt_dlp() -> Result<PathBuf, String> {
    if let Some(p) = find_yt_dlp() {
        return Ok(p);
    }
    download_yt_dlp_sync()
}

#[tauri::command]
pub fn check_yt_dlp() -> bool {
    find_yt_dlp().is_some()
}

#[tauri::command]
pub async fn install_yt_dlp() -> Result<String, String> {
    blocking(|| download_yt_dlp_sync().map(|p| p.to_string_lossy().to_string())).await
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedTrackPayload {
    playlist_id: Option<String>,
    missing_index: Option<usize>,
    path: String,
    title: String,
    artist: String,
    album: String,
    duration: f64,
    cover: Option<String>,
    lyrics: Option<String>,
}

fn embed_metadata(
    dest: &Path,
    title: &str,
    artist: &str,
    album: &str,
    year: Option<u32>,
    cover_bytes: Option<&(PathBuf, Vec<u8>, String)>,
    lyrics: Option<&str>,
) -> f64 {
    let mut dur = 0.0;
    if let Ok(mut tagged) = read_from_path(dest) {
        dur = tagged.properties().duration().as_secs_f64();
        if tagged.primary_tag().is_none() {
            let tt = tagged.primary_tag_type();
            tagged.insert_tag(Tag::new(tt));
        }
        if let Some(tag) = tagged.primary_tag_mut() {
            tag.set_title(title.to_string());
            tag.set_artist(artist.to_string());
            if !album.is_empty() {
                tag.set_album(album.to_string());
            }
            if let Some(y) = year {
                tag.set_year(y);
            }
            if let Some(l) = lyrics.filter(|l| !l.trim().is_empty()) {
                tag.insert_text(ItemKey::Lyrics, l.to_string());
            }
            if let Some((_, data, mime)) = cover_bytes {
                let m = if mime.contains("png") { MimeType::Png } else { MimeType::Jpeg };
                let pic = Picture::new_unchecked(PictureType::CoverFront, Some(m), None, data.clone());
                tag.remove_picture_type(PictureType::CoverFront);
                tag.push_picture(pic);
            }
            let _ = tagged.save_to_path(dest, WriteOptions::default());
        }
    }
    dur
}

fn fetch_spotify_track_meta(u: &str) -> Result<(String, String, Option<String>), String> {
    let path = u.split("open.spotify.com/").nth(1).unwrap_or("");
    let segs: Vec<&str> = path.split(|c| c == '/' || c == '?').filter(|s| !s.is_empty()).collect();
    let pos = segs.iter().position(|s| *s == "track").ok_or("No es un enlace de canción de Spotify")?;
    let id = segs.get(pos + 1).ok_or("Enlace de canción incompleto")?;
    let page = agent()
        .get(&format!("https://open.spotify.com/embed/track/{id}"))
        .call()
        .map_err(|e| format!("No se pudo leer la canción de Spotify: {e}"))?
        .into_string()
        .map_err(|e| e.to_string())?;
    let og_cover = extract_og_image(&page);
    let id_pos = page.find("id=\"__NEXT_DATA__\"").ok_or("No se pudieron leer los datos de la canción")?;
    let start = page[id_pos..].find('>').ok_or("HTML inválido")? + id_pos + 1;
    let end = page[start..].find("</script>").ok_or("Respuesta incompleta")? + start;
    let v: Value = serde_json::from_str(&page[start..end]).map_err(|e| e.to_string())?;
    let entity = if v["props"]["pageProps"]["state"]["data"]["entity"].is_object() {
        &v["props"]["pageProps"]["state"]["data"]["entity"]
    } else {
        &v["props"]["pageProps"]["entity"]
    };
    let title = entity["name"]
        .as_str()
        .or_else(|| entity["title"].as_str())
        .ok_or("No se encontró el título de la canción")?
        .to_string();
    let artist = entity["artists"]
        .as_array()
        .and_then(|a| a.first())
        .and_then(|x| x["name"].as_str())
        .or_else(|| entity["subtitle"].as_str())
        .unwrap_or("Artista")
        .replace('\u{a0}', " ");
    let cover = entity["coverArt"]["sources"]
        .as_array()
        .and_then(|a| a.first())
        .and_then(|s| s["url"].as_str())
        .or_else(|| entity["visualIdentity"]["image"].as_array().and_then(|a| a.first()).and_then(|s| s["url"].as_str()))
        .map(|s| s.to_string())
        .or(og_cover);
    Ok((title, artist, cover))
}

#[tauri::command]
pub async fn resolve_single_song(app: tauri::AppHandle, input: String) -> Result<ResolvedTrackPayload, String> {
    let raw = input.trim().to_string();
    if raw.is_empty() {
        return Err("Pega el enlace o nombre de una canción.".into());
    }
    let (title, artist, cover_url) = blocking(move || {
        if raw.contains("open.spotify.com") && raw.contains("/track/") {
            fetch_spotify_track_meta(&raw)
        } else if raw.starts_with("http://") || raw.starts_with("https://") {
            let ytdlp = ensure_yt_dlp()?;
            let mut cmd = Command::new(&ytdlp);
            cmd.args(["--no-playlist", "--no-warnings", "-J", &raw]);
            #[cfg(target_os = "windows")]
            cmd.creation_flags(0x0800_0000);
            let out = cmd.output().map_err(|e| format!("Error leyendo enlace: {e}"))?;
            if !out.status.success() {
                return Err("No se pudo leer el enlace de la canción.".into());
            }
            let v: Value = serde_json::from_slice(&out.stdout).map_err(|e| e.to_string())?;
            let raw_title = v["track"]
                .as_str()
                .or_else(|| v["title"].as_str())
                .unwrap_or("Canción")
                .to_string();
            let raw_artist = v["artist"]
                .as_str()
                .or_else(|| v["uploader"].as_str())
                .or_else(|| v["channel"].as_str())
                .unwrap_or("Artista")
                .replace(" - Topic", "");
            let (t, a) = if let Some((l, r)) = raw_title.split_once(" - ") {
                (r.trim().to_string(), l.trim().to_string())
            } else {
                (raw_title, raw_artist)
            };
            let thumb = v["thumbnail"].as_str().map(|s| s.to_string());
            Ok((t, a, thumb))
        } else if let Some((a, t)) = raw.split_once(" - ") {
            Ok((t.trim().to_string(), a.trim().to_string(), None))
        } else {
            Ok((raw, "Artista".to_string(), None))
        }
    })
    .await?;

    resolve_track_audio(
        app,
        None,
        None,
        title,
        artist,
        Some("Mi Biblioteca".into()),
        cover_url,
        None,
    )
    .await
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn resolve_track_audio(
    app: tauri::AppHandle,
    playlist_id: Option<String>,
    missing_index: Option<usize>,
    title: String,
    artist: String,
    album: Option<String>,
    cover_url: Option<String>,
    lyrics: Option<String>,
) -> Result<ResolvedTrackPayload, String> {
    blocking(move || {
        let ytdlp = ensure_yt_dlp()?;
        let out_dir = music_alify_dir();
        let base_name = clean_filename(&format!("{} - {}", artist, title));
        let template = out_dir.join(format!("{base_name}.%(ext)s"));
        let query = format!("ytsearch1:{} - {} audio", artist, title);

        let mut cmd = Command::new(&ytdlp);
        cmd.args([
            "--no-playlist",
            "--no-warnings",
            "-f",
            "bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio[ext=opus]/bestaudio",
            "-o",
            &template.to_string_lossy(),
            &query,
        ]);
        #[cfg(target_os = "windows")]
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW

        let out = cmd.output().map_err(|e| format!("Error ejecutando yt-dlp: {e}"))?;
        if !out.status.success() {
            let err = String::from_utf8_lossy(&out.stderr);
            return Err(format!("yt-dlp no pudo resolver la pista: {}", err.lines().last().unwrap_or("")));
        }

        // localizar el archivo descargado
        let mut found: Option<PathBuf> = None;
        for ext in ["m4a", "mp3", "opus", "ogg", "webm", "wav", "flac"] {
            let p = out_dir.join(format!("{base_name}.{ext}"));
            if p.is_file() {
                found = Some(p);
                break;
            }
        }
        let dest = found.ok_or("yt-dlp terminó pero no se encontró el archivo de audio")?;

        let album_str = album.unwrap_or_else(|| "Alify Descargas".into());
        let cov = cache_cover_for(&title, &artist, &album_str, cover_url.as_deref());
        let lyr = lyrics
            .filter(|l| !l.trim().is_empty())
            .or_else(|| query_lrclib(&title, &artist, &album_str, 0.0).ok().map(|l| l.text));

        if let Some(ref l) = lyr {
            let _ = fs::write(dest.with_extension("lrc"), l);
        }

        let duration = embed_metadata(&dest, &title, &artist, &album_str, None, cov.as_ref(), lyr.as_deref());
        let cover_data = cov.map(|(_, bytes, mime)| format!("data:{};base64,{}", mime, STANDARD.encode(bytes)));

        let payload = ResolvedTrackPayload {
            playlist_id,
            missing_index,
            path: dest.to_string_lossy().to_string(),
            title,
            artist,
            album: album_str,
            duration,
            cover: cover_data,
            lyrics: lyr,
        };
        let _ = app.emit("track-resolved", &payload);
        Ok(payload)
    })
    .await
}

// ---------- exportar canción con etiquetas incrustadas ----------
#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn export_song(
    src: String,
    dest_dir: String,
    title: String,
    artist: String,
    album: String,
    year: Option<u32>,
    cover: Option<String>,
    lyrics: Option<String>,
) -> Result<String, String> {
    blocking(move || {
        let srcp = Path::new(&src);
        if !srcp.is_file() {
            return Err("El archivo original no existe (las pistas demo no se pueden exportar)".into());
        }
        let ext = srcp.extension().and_then(|e| e.to_str()).unwrap_or("mp3");
        let dest = PathBuf::from(&dest_dir).join(format!("{} - {}.{}", clean_filename(&artist), clean_filename(&title), ext));
        if dest == srcp {
            return Err("Elige una carpeta distinta a la del archivo original".into());
        }
        fs::copy(srcp, &dest).map_err(|e| e.to_string())?;

        let mut tagged = read_from_path(&dest).map_err(|e| e.to_string())?;
        if tagged.primary_tag().is_none() {
            let tt = tagged.primary_tag_type();
            tagged.insert_tag(Tag::new(tt));
        }
        let tag = tagged.primary_tag_mut().ok_or("El formato no admite etiquetas")?;
        tag.set_title(title);
        tag.set_artist(artist);
        if !album.is_empty() {
            tag.set_album(album);
        }
        if let Some(y) = year {
            tag.set_year(y);
        }
        if let Some(l) = lyrics.filter(|l| !l.trim().is_empty()) {
            tag.insert_text(ItemKey::Lyrics, l);
        }
        if let Some(c) = cover {
            if let Some((meta, b64)) = c.split_once(',') {
                if let Ok(data) = STANDARD.decode(b64) {
                    let mime = if meta.contains("png") {
                        MimeType::Png
                    } else if meta.contains("gif") {
                        MimeType::Gif
                    } else {
                        MimeType::Jpeg
                    };
                    let pic = Picture::new_unchecked(PictureType::CoverFront, Some(mime), None, data);
                    tag.remove_picture_type(PictureType::CoverFront);
                    tag.push_picture(pic);
                }
            }
        }
        tagged
            .save_to_path(&dest, WriteOptions::default())
            .map_err(|e| e.to_string())?;
        Ok(dest.to_string_lossy().to_string())
    })
    .await
}
