use base64::{engine::general_purpose::STANDARD, Engine};
use lofty::{prelude::*, tag::ItemKey};
use serde_json::{json, Value};
use tauri::{
    plugin::{Builder, PluginHandle, TauriPlugin},
    Manager, Wry,
};

tauri::ios_plugin_binding!(init_alify_device_audio);

pub fn plugin() -> TauriPlugin<Wry> {
    Builder::new("device-audio")
        .setup(|app, api| {
            app.manage(api.register_ios_plugin(init_alify_device_audio)?);
            Ok(())
        })
        .build()
}

#[derive(serde::Deserialize)]
struct Reply {
    json: String,
}

#[tauri::command]
pub async fn device(
    handle: tauri::State<'_, PluginHandle<Wry>>,
    action: String,
    args: Value,
) -> Result<Value, String> {
    let reply: Reply = handle
        .run_mobile_plugin_async("dispatch", json!({ "action": action, "args": args }))
        .await
        .map_err(|error| error.to_string())?;
    let result: Value = serde_json::from_str(&reply.json).map_err(|error| error.to_string())?;
    if !matches!(action.as_str(), "artwork" | "coverThumb") {
        return Ok(result);
    }
    let Some(path) = result.as_str().map(str::to_owned) else {
        return Ok(if action == "coverThumb" {
            json!("")
        } else {
            json!({})
        });
    };
    tauri::async_runtime::spawn_blocking(move || {
        let tagged = lofty::read_from_path(path).ok();
        let tag = tagged
            .as_ref()
            .and_then(|audio| audio.primary_tag().or_else(|| audio.first_tag()));
        let cover = tag
            .and_then(|tag| tag.pictures().first())
            .filter(|picture| picture.data().len() <= 4_000_000)
            .map(|picture| {
                format!(
                    "data:{};base64,{}",
                    picture
                        .mime_type()
                        .map(|mime| mime.as_str())
                        .unwrap_or("image/jpeg"),
                    STANDARD.encode(picture.data())
                )
            });
        if action == "coverThumb" {
            json!(cover.unwrap_or_default())
        } else {
            json!({"cover": cover, "lyrics": tag.and_then(|tag| tag.get_string(&ItemKey::Lyrics))})
        }
    })
    .await
    .map_err(|error| error.to_string())
}
