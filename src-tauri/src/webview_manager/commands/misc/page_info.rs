//! Команды обновления информации о странице

use tauri::{AppHandle, Manager, Emitter};
use crate::webview_manager::types::WebViewUpdateEvent;

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
