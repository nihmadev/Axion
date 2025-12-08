use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn execute_script(
    app: AppHandle,
    id: String,
    script: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval(&script)
            .map_err(|e| format!("Script execution failed: {}", e))?;
    }

    Ok(())
}
