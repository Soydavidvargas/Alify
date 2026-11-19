use base64::{engine::general_purpose::STANDARD, Engine as _};
use lofty::{prelude::*, read_from_path, tag::ItemKey};
use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::{Manager, WindowEvent};

mod extras;
mod oauth;

const AUDIO_EXTS: [&str; 7] = ["mp3", "flac", "wav", "ogg", "m4a", "opus", "webm"];

#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TrackMeta {
    path: String,
    title: String,
    artist: String,
    album: String,
    year: Option<u32>,
    duration: f64,
    cover: Option<String>,
    lyrics: Option<String>,
}

fn is_audio(p: &Path) -> bool {
    p.extension()
        .and_then(|e| e.to_str())
        .map(|e| AUDIO_EXTS.contains(&e.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn read_meta(path: &Path) -> TrackMeta {
    let mut m = TrackMeta {
        path: path.to_string_lossy().to_string(),
        title: path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default(),
        artist: "Artista desconocido".into(),
        album: "Álbum desconocido".into(),
        ..Default::default()
    };

    if let Ok(tagged) = read_from_path(path) {
        m.duration = tagged.properties().duration().as_secs_f64();
        if let Some(tag) = tagged.primary_tag().or_else(|| tagged.first_tag()) {
            if let Some(t) = tag.title() {
                m.title = t.to_string();
            }
            if let Some(a) = tag.artist() {
                m.artist = a.to_string();
            }
            if let Some(a) = tag.album() {
                m.album = a.to_string();
            }
            m.year = tag.year();
            if let Some(l) = tag.get_string(&ItemKey::Lyrics) {
                if !l.trim().is_empty() {
                    m.lyrics = Some(l.to_string());
                }
            }
            if let Some(pic) = tag.pictures().first() {
                let mime = pic
                    .mime_type()
                    .map(|x| x.as_str().to_string())
                    .unwrap_or_else(|| "image/jpeg".into());
                m.cover = Some(format!("data:{};base64,{}", mime, STANDARD.encode(pic.data())));
            }
        }
    }

    // Letra sincronizada junto al audio: cancion.lrc
    if m.lyrics.is_none() {
        if let Ok(txt) = fs::read_to_string(path.with_extension("lrc")) {
            m.lyrics = Some(txt);
        }
    }
    m
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>, depth: u8) {
    if depth > 8 {
        return;
    }
    if let Ok(rd) = fs::read_dir(dir) {
        for e in rd.flatten() {
            let p = e.path();
            if p.is_dir() {
                walk(&p, out, depth + 1);
            } else if is_audio(&p) {
                out.push(p);
            }
        }
    }
}

#[tauri::command]
fn scan_folder(dir: String) -> Result<Vec<TrackMeta>, String> {
    let root = if dir.trim().is_empty() {
        let base = std::env::var_os("USERPROFILE")
            .or_else(|| std::env::var_os("HOME"))
            .map(PathBuf::from)
            .ok_or("No se encontró la carpeta de usuario")?;
        let d = base.join("Music").join("Alify");
        let _ = fs::create_dir_all(&d);
        d
    } else {
        PathBuf::from(&dir)
    };
    if !root.is_dir() {
        return Err(format!("No es una carpeta: {dir}"));
    }
    let mut files = Vec::new();
    walk(&root, &mut files, 0);
    files.sort();
    Ok(files.iter().map(|p| read_meta(p)).collect())
}

#[tauri::command]
fn read_metadata(path: String) -> TrackMeta {
    read_meta(Path::new(&path))
}

#[tauri::command]
fn toggle_floating(app: tauri::AppHandle) -> Result<bool, String> {
    let w = app
        .get_webview_window("floating")
        .ok_or("ventana flotante no encontrada")?;
    if w.is_visible().map_err(|e| e.to_string())? {
        w.hide().map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        w.show().map_err(|e| e.to_string())?;
        Ok(true)
    }
}

#[tauri::command]
fn hide_floating(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("floating") {
        let _ = w.hide();
    }
}

#[tauri::command]
fn focus_main(app: tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
    }
}

#[cfg(desktop)]
#[derive(Clone, Copy)]
struct FloatBounds {
    position: tauri::PhysicalPosition<i32>,
    size: tauri::PhysicalSize<u32>,
}

#[tauri::command]
fn dock_floating(app: tauri::AppHandle, docked: bool) -> Result<(), String> {
    #[cfg(desktop)]
    {
        static RESTORE: std::sync::Mutex<Option<FloatBounds>> = std::sync::Mutex::new(None);
        let mut saved = RESTORE.lock().map_err(|e| e.to_string())?;
        if saved.is_some() == docked { return Ok(()); }
        let w = app.get_webview_window("floating").ok_or("Ventana flotante no encontrada")?;
        let before = FloatBounds {
            position: w.outer_position().map_err(|e| e.to_string())?,
            size: w.inner_size().map_err(|e| e.to_string())?,
        };
        let target = if let Some(original) = *saved {
            original
        } else {
            let monitor = w.current_monitor().map_err(|e| e.to_string())?.ok_or("Monitor no disponible")?;
            let area = monitor.work_area();
            let size = tauri::LogicalSize::new(248.0, 97.0).to_physical::<u32>(monitor.scale_factor());
            FloatBounds {
                size,
                position: tauri::PhysicalPosition::new(
                    area.position.x + (area.size.width as i32 - size.width as i32) / 2,
                    area.position.y,
                ),
            }
        };
        let update = || -> tauri::Result<()> {
            w.set_min_size(None::<tauri::LogicalSize<f64>>)?;
            w.set_resizable(!docked)?;
            w.set_size(target.size)?;
            w.set_position(target.position)?;
            if !docked { w.set_min_size(Some(tauri::LogicalSize::new(240.0, 96.0)))?; }
            Ok(())
        };
        if let Err(error) = update() {
            let _ = w.set_resizable(docked);
            let _ = w.set_size(before.size);
            let _ = w.set_position(before.position);
            return Err(error.to_string());
        }
        *saved = if docked { Some(before) } else { None };
    }
    Ok(())
}

#[tauri::command]
fn delete_all_downloaded_songs() -> Result<(), String> {
    if let Some(base) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
        let music_dir = PathBuf::from(base).join("Music").join("Alify");
        if music_dir.is_dir() {
            let _ = fs::remove_dir_all(&music_dir);
            let _ = fs::create_dir_all(&music_dir);
        }
    }
    if let Some(local) = std::env::var_os("LOCALAPPDATA") {
        let covers_dir = PathBuf::from(local).join("Alify").join("covers");
        if covers_dir.is_dir() {
            let _ = fs::remove_dir_all(&covers_dir);
            let _ = fs::create_dir_all(&covers_dir);
        }
    }
    Ok(())
}

#[tauri::command]
fn set_autostart(enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_str = exe.to_string_lossy().to_string();
        let mut cmd = std::process::Command::new("reg");
        if enabled {
            cmd.args([
                "add",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                "Alify",
                "/t",
                "REG_SZ",
                "/d",
                &format!("\"{exe_str}\""),
                "/f",
            ]);
        } else {
            cmd.args([
                "delete",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                "Alify",
                "/f",
            ]);
        }
        cmd.creation_flags(0x0800_0000);
        let _ = cmd.output();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Todos los datos del usuario (localStorage: playlists, favoritos, temas
    // personalizados; caché de WebView2) viven en %LOCALAPPDATA%\Alify.
    // Es una ruta de usuario: no requiere permisos de administrador.
    #[cfg(target_os = "windows")]
    if let Some(base) = std::env::var_os("LOCALAPPDATA") {
        let dir = PathBuf::from(base).join("Alify").join("webview");
        if fs::create_dir_all(&dir).is_ok() {
            std::env::set_var("WEBVIEW2_USER_DATA_FOLDER", &dir);
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_folder,
            read_metadata,
            toggle_floating,
            hide_floating,
            focus_main,
            dock_floating,
            delete_all_downloaded_songs,
            set_autostart,
            extras::fetch_playlist_link,
            extras::search_lyrics,
            extras::fetch_synced_lyrics,
            extras::search_cover,
            extras::enrich_wanted_track,
            extras::check_yt_dlp,
            extras::install_yt_dlp,
            extras::resolve_track_audio,
            extras::resolve_single_song,
            extras::export_song,
            oauth::open_provider_login
        ])
        .setup(|_app| {
            if let Some(main) = _app.get_webview_window("main") {
                if let Some(ic) = _app.default_window_icon().cloned() {
                    let _ = main.set_icon(ic);
                }
                #[cfg(target_os = "windows")]
                {
                    use window_vibrancy::{apply_acrylic, apply_blur};
                    // Acrylic (Win10 1809+/Win11); si falla, blur clásico.
                    if apply_acrylic(&main, Some((16, 16, 18, 120))).is_err() {
                        let _ = apply_blur(&main, Some((16, 16, 18, 120)));
                    }
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            // Cerrar la principal termina la app (la flotante no la mantiene viva).
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { .. } = event {
                    window.app_handle().exit(0);
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error al ejecutar Alify");
}

