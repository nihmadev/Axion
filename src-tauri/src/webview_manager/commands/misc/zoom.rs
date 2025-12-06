//! Команды управления масштабом

use tauri::{AppHandle, Manager};

/// Установка масштаба
#[tauri::command]
pub async fn set_zoom(
    app: AppHandle,
    id: String,
    zoom: f64,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.set_zoom(zoom)
            .map_err(|e| format!("Failed to set zoom: {}", e))?;
    }

    Ok(())
}
