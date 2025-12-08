use tauri::Manager;
use crate::AppState;

#[tauri::command]
pub async fn freeze_tab(app: tauri::AppHandle, state: tauri::State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    {
        let mut frozen_tabs = state.frozen_tabs.lock().map_err(|e| e.to_string())?;
        frozen_tabs.insert(tab_id.clone());
    }
    
    let webview_id = format!("webview_{}", tab_id);
    if let Some(webview) = app.get_webview(&webview_id) {
        let _ = webview.hide();
        let _ = webview.close();
    }
    
    {
        let mut manager = state.webview_manager.lock().map_err(|e| e.to_string())?;
        manager.remove(&tab_id);
    }
    
    Ok(true)
}

#[tauri::command]
pub async fn unfreeze_tab(state: tauri::State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    let mut frozen_tabs = state.frozen_tabs.lock().map_err(|e| e.to_string())?;
    frozen_tabs.remove(&tab_id);
    Ok(true)
}

#[tauri::command]
pub async fn is_tab_frozen(state: tauri::State<'_, AppState>, tab_id: String) -> Result<bool, String> {
    let frozen_tabs = state.frozen_tabs.lock().map_err(|e| e.to_string())?;
    Ok(frozen_tabs.contains(&tab_id))
}
