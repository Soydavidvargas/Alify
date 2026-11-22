use base64::{engine::general_purpose::STANDARD, Engine};
use lofty::{prelude::*, tag::ItemKey};
use serde_json::Value;
use std::{fs::File, os::fd::FromRawFd};
use tauri::{
    plugin::{Builder, PluginHandle, TauriPlugin},
    Manager, Wry,
};

pub fn plugin() -> TauriPlugin<Wry> {
    Builder::new("device-audio")
        .setup(|app, api| {
            app.manage(api.register_android_plugin("app.alify.player", "DeviceAudioPlugin")?);
            Ok(())
        })
        .build()
}

#[tauri::command]
pub async fn device(
    handle: tauri::State<'_, PluginHandle<Wry>>,
    action: String,
    args: Value,
) -> Result<Value, String> {
    match action.as_str() {
        "artwork" => {
            let fd: i32 = handle
                .run_mobile_plugin_async("openAudio", args)
                .await
                .map_err(|e| e.to_string())?;
            // ParcelFileDescriptor.detachFd transfers ownership to this process.
            let mut file = unsafe { File::from_raw_fd(fd) };
            tauri::async_runtime::spawn_blocking(move || {
                let tagged = lofty::read_from(&mut file).ok();
                let tag = tagged.as_ref().and_then(|t| t.primary_tag().or_else(|| t.first_tag()));
                let cover = tag.and_then(|t| t.pictures().first()).filter(|p| p.data().len() <= 12_000_000)
                    .map(|p| format!("data:{};base64,{}", p.mime_type().map(|m| m.as_str()).unwrap_or("image/jpeg"), STANDARD.encode(p.data())));
                serde_json::json!({"cover": cover, "lyrics": tag.and_then(|t| t.get_string(&ItemKey::Lyrics))})
            }).await.map_err(|e| e.to_string())
        }
        "reminder" | "transferProgress" | "interruptTransfer" => handle.run_mobile_plugin_async(&action, args).await.map_err(|e| e.to_string()),
        "provider" => handle.run_mobile_plugin_async("provider", serde_json::json!({
            "url": args["url"], "reader": include_str!("extractor.js")
        })).await.map_err(|e| e.to_string()),
        "browserPlayer" | "sharedLink" | "openPlayer" | "wrapped" | "saveWrapped" | "pickFolder" | "coverThumb" | "profilePhoto" | "deleteSongs" | "archiveList" | "spotifyBrowser" | "pickList" | "remoteList" | "saveAudio" | "migrationExtras" | "enrichMigration" | "migrationState" | "scan" | "control" | "status" | "pin" | "pickLyrics" | "theme" | "fullscreen" => handle
            .run_mobile_plugin_async(&action, args)
            .await
            .map_err(|e| e.to_string()),
        _ => Err("Acción multimedia desconocida".into()),
    }
}
