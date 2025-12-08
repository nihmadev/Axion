use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn close_webview(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    
    {
        let mut manager = state.webview_manager.lock().map_err(|e| e.to_string())?;
        manager.remove(&id);
    }

    let webview_id = format!("webview_{}", id);
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.close().map_err(|e| format!("Failed to close webview: {}", e))?;
    }

    Ok(())
}
