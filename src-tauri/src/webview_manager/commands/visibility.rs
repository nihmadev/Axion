//! Команды управления видимостью и размерами WebView

use tauri::{AppHandle, Manager, LogicalPosition, LogicalSize};
use crate::webview_manager::types::WebViewBounds;

/// Обновление позиции и размера WebView
#[tauri::command]
pub async fn update_webview_bounds(
    app: AppHandle,
    id: String,
    bounds: WebViewBounds,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    // Сохраняем bounds для восстановления при показе
    {
        let state = app.state::<crate::AppState>();
        if let Ok(mut bounds_map) = state.webview_bounds.lock() {
            bounds_map.insert(id.clone(), bounds.clone());
        };
    }
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.set_position(LogicalPosition::new(bounds.x, bounds.y))
            .map_err(|e| format!("Failed to set position: {}", e))?;
        webview.set_size(LogicalSize::new(bounds.width, bounds.height))
            .map_err(|e| format!("Failed to set size: {}", e))?;
    }

    Ok(())
}

/// Показать/скрыть WebView
#[tauri::command]
pub async fn set_webview_visible(
    app: AppHandle,
    id: String,
    visible: bool,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        let state = app.state::<crate::AppState>();
        
        if visible {
            // Показываем WebView используя нативный метод
            webview.show()
                .map_err(|e| format!("Failed to show webview: {}", e))?;
            
            // Восстанавливаем позицию и размер из сохранённых bounds
            let bounds_opt = {
                let bounds_map = state.webview_bounds.lock().map_err(|e| e.to_string())?;
                bounds_map.get(&id).cloned()
            };
            
            if let Some(bounds) = bounds_opt {
                // Проверяем что bounds валидные
                if bounds.x >= 0.0 && bounds.y >= 0.0 && bounds.width > 10.0 && bounds.height > 10.0 {
                    webview.set_position(LogicalPosition::new(bounds.x, bounds.y))
                        .map_err(|e| format!("Failed to set position: {}", e))?;
                    webview.set_size(LogicalSize::new(bounds.width, bounds.height))
                        .map_err(|e| format!("Failed to set size: {}", e))?;
                }
            }
        } else {
            // Скрываем WebView используя нативный метод hide()
            // Это надёжнее чем set_size(0,0) на Windows
            webview.hide()
                .map_err(|e| format!("Failed to hide webview: {}", e))?;
        }
    }

    Ok(())
}
