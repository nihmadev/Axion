mod unsupported_sites;
mod site_detection;
mod content_finder;
mod metadata;
mod styles;
mod template;
mod notifications;
mod script;

pub use script::get_reader_mode_script;

use tauri::{AppHandle, Manager};
#[tauri::command]
pub async fn toggle_reader_mode(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        let script = get_reader_mode_script();
        webview.eval(&script)
            .map_err(|e| format!("Reader Mode activation failed: {}", e))?;
    } else {
        return Err("WebView not found".to_string());
    }

    Ok(())
}
