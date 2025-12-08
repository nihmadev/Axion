use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn navigate_webview(
    app: AppHandle,
    id: String,
    url: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        let parsed_url: tauri::Url = url.parse()
            .map_err(|e| format!("Invalid URL: {}", e))?;
        webview.navigate(parsed_url)
            .map_err(|e| format!("Navigation failed: {}", e))?;
        
        let state = app.state::<crate::AppState>();
        if let Ok(mut manager) = state.webview_manager.lock() {
            manager.update_url(&id, url);
        };
    }

    Ok(())
}

#[tauri::command]
pub async fn go_back(
    app: AppHandle,
    id: String,
) -> Result<bool, String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval("window.history.back()")
            .map_err(|e| format!("Failed to go back: {}", e))?;
        return Ok(true);
    }
    
    Ok(false)
}

#[tauri::command]
pub async fn go_forward(
    app: AppHandle,
    id: String,
) -> Result<bool, String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval("window.history.forward()")
            .map_err(|e| format!("Failed to go forward: {}", e))?;
        return Ok(true);
    }
    
    Ok(false)
}

#[tauri::command]
pub async fn reload_webview(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval("window.location.reload()")
            .map_err(|e| format!("Failed to reload: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn stop_webview(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval("window.stop()")
            .map_err(|e| format!("Failed to stop: {}", e))?;
    }

    Ok(())
}
