//! Migración directa por inicio de sesión en reproductores web (Spotify, YouTube Music,
//! SoundCloud, Deezer, Apple Music, Tidal).
//! Compatible con Trusted Types (YouTube/Google) sin usar innerHTML, y soporta
//! extracción DOM + auto-scroll específico de cada plataforma.

use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::{Deserialize, Serialize};
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::Duration,
};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MigratedTrack {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub cover_url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MigratedPlaylistPayload {
    pub provider: String,
    pub name: String,
    pub tracks: Vec<MigratedTrack>,
}

fn extractor_js() -> String {
    const ENC: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/extractor.bin"));
    const KEY: [u8; 16] = [
        0x4A, 0x9F, 0x2C, 0xE1, 0x73, 0xB8, 0x15, 0xD4,
        0x6E, 0x09, 0xA7, 0x3B, 0xF2, 0x58, 0xC6, 0x81,
    ];
    let dec: Vec<u8> = ENC
        .iter()
        .enumerate()
        .map(|(i, b)| b ^ KEY[i % KEY.len()] ^ ((i as u8).wrapping_mul(31)))
        .collect();
    String::from_utf8(dec).unwrap_or_default()
}

fn provider_url(provider: &str) -> (&'static str, &'static str) {
    match provider {
        "spotify" => ("Spotify", "https://open.spotify.com/collection/tracks"),
        "ytmusic" => ("YouTube Music", "https://music.youtube.com/library/playlists"),
        "soundcloud" => ("SoundCloud", "https://soundcloud.com/you/likes"),
        "deezer" => ("Deezer", "https://www.deezer.com/"),
        "apple" => ("Apple Music", "https://music.apple.com/"),
        "tidal" => ("Tidal", "https://listen.tidal.com/my-collection/tracks"),
        _ => ("Reproductor Web", "https://open.spotify.com/"),
    }
}

fn deliver_to_main(app: &tauri::AppHandle, payload: MigratedPlaylistPayload) {
    let _ = app.emit("alify:migrated-provider", &payload);
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.unminimize();
        let _ = main.show();
        let _ = main.set_focus();
    }
    let app_c = app.clone();
    thread::spawn(move || {
        thread::sleep(Duration::from_millis(80));
        if let Some(w) = app_c.get_webview_window("migrator") {
            let _ = w.close();
        }
    });
}

#[tauri::command]
pub async fn open_provider_login(app: tauri::AppHandle, provider: String) -> Result<(), String> {
    if let Some(existing) = app.get_webview_window("migrator") {
        let _ = existing.close();
    }
    let (label_name, raw_url) = provider_url(&provider);
    let url: tauri::Url = raw_url.parse().map_err(|e| format!("{e}"))?;

    let delivered = Arc::new(AtomicBool::new(false));
    let delivered_nav = delivered.clone();
    let app_nav = app.clone();

    let win = WebviewWindowBuilder::new(&app, "migrator", WebviewUrl::External(url))
        .title(format!("Alify · Conectar con {label_name}"))
        .inner_size(1040.0, 720.0)
        .center()
        .initialization_script(extractor_js())
        .on_navigation(move |nav_url| {
            if nav_url.host_str() == Some("alify-sync.local") {
                if let Some((_, val)) = nav_url.query_pairs().find(|(k, _)| k == "data") {
                    if let Ok(bytes) = STANDARD.decode(val.as_bytes()) {
                        if let Ok(payload) = serde_json::from_slice::<MigratedPlaylistPayload>(&bytes) {
                            if !delivered_nav.swap(true, Ordering::SeqCst) {
                                deliver_to_main(&app_nav, payload);
                            }
                        }
                    }
                }
                return false;
            }
            true
        })
        .build()
        .map_err(|e| format!("No se pudo abrir la ventana de inicio de sesión: {e}"))?;

    let _ = win.set_focus();
    Ok(())
}

