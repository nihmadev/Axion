//! Прочие команды WebView (zoom, script execution, page info update)

use tauri::{AppHandle, Manager, Emitter};
use crate::webview_manager::types::WebViewUpdateEvent;

/// Выполнение JavaScript
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

/// Обновить информацию о странице (вызывается из JavaScript в WebView)
#[tauri::command]
pub async fn update_page_info(
    app: AppHandle,
    id: String,
    url: String,
    title: String,
    favicon: Option<String>,
) -> Result<(), String> {
    // Обновляем в менеджере
    {
        let state = app.state::<crate::AppState>();
        if let Ok(mut manager) = state.webview_manager.lock() {
            manager.update_url(&id, url.clone());
            manager.update_title(&id, title.clone());
            if let Some(ref fav) = favicon {
                manager.update_favicon(&id, fav.clone());
            }
        };
    }
    
    // Отправляем событие
    let _ = app.emit("webview-url-changed", WebViewUpdateEvent {
        id,
        url: Some(url),
        title: Some(title),
        favicon,
        is_loading: Some(false),
        can_go_back: None,
        can_go_forward: None,
    });
    
    Ok(())
}
