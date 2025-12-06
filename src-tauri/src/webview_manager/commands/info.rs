//! Команды получения информации о WebView

use tauri::{AppHandle, Manager};
use crate::webview_manager::types::WebViewInfo;
use crate::webview_manager::polling::extract_title_from_url;

/// Получение информации о WebView
#[tauri::command]
pub async fn get_webview_info(
    app: AppHandle,
    id: String,
) -> Result<Option<WebViewInfo>, String> {
    let state = app.state::<crate::AppState>();
    let manager = state.webview_manager.lock().map_err(|e| e.to_string())?;
    Ok(manager.get(&id).cloned())
}

/// Получить URL текущей страницы
/// ВАЖНО: Приоритет у нативного URL из WebView - он всегда актуален после навигации
#[tauri::command]
pub async fn get_webview_url(
    app: AppHandle,
    id: String,
) -> Result<String, String> {
    let webview_id = format!("webview_{}", id);
    
    // Получаем URL напрямую из WebView - это самый надежный источник
    if let Some(webview) = app.get_webview(&webview_id) {
        let native_url = webview.url()
            .map(|u| u.to_string())
            .map_err(|e| format!("Failed to get URL: {}", e))?;
        
        // Если нативный URL валидный - используем его
        if !native_url.is_empty() && native_url != "about:blank" {
            return Ok(native_url);
        }
    }
    
    // Fallback на менеджер (для about:blank или если webview не найден)
    let state = app.state::<crate::AppState>();
    if let Ok(manager) = state.webview_manager.lock() {
        if let Some(info) = manager.get(&id) {
            if !info.url.is_empty() {
                return Ok(info.url.clone());
            }
        }
    };

    Err("WebView not found".to_string())
}

/// Получить полную информацию о странице (URL, title, favicon)
/// Использует JavaScript для получения реального window.location.href
#[tauri::command]
pub async fn get_real_page_info(
    app: AppHandle,
    id: String,
) -> Result<WebViewInfo, String> {
    let webview_id = format!("webview_{}", id);
    let state = app.state::<crate::AppState>();
    
    // Получаем webview
    let webview = app.get_webview(&webview_id)
        .ok_or_else(|| "WebView not found".to_string())?;
    
    // Получаем нативный URL
    let native_url = webview.url()
        .map(|u| u.to_string())
        .unwrap_or_default();
    
    // Принудительно обновляем через JavaScript - это ЕДИНСТВЕННЫЙ надёжный способ
    // получить реальный URL после редиректов Google
    let force_update_script = r#"
        (function() {
            var url = window.location.href;
            var title = document.title || '';
            var favicon = '';
            var iconLink = document.querySelector('link[rel="icon"]') || 
                          document.querySelector('link[rel="shortcut icon"]') ||
                          document.querySelector('link[rel="apple-touch-icon"]');
            if (iconLink) favicon = iconLink.href;
            if (!favicon) {
                try { favicon = new URL('/favicon.ico', window.location.origin).href; } catch(e) {}
            }
            
            // Отправляем через title-IPC - это синхронно вызовет on_document_title_changed
            var data = JSON.stringify({url: url, title: title, favicon: favicon});
            var originalTitle = document.title;
            document.title = '__AXION_IPC__:' + data;
            // Важно: НЕ восстанавливаем title сразу, даём время на обработку
        })();
    "#;
    
    let _ = webview.eval(force_update_script);
    
    // Даём больше времени на обработку IPC
    tokio::time::sleep(tokio::time::Duration::from_millis(150)).await;
    
    // Восстанавливаем title после получения данных
    let restore_title_script = r#"
        (function() {
            if (document.title.startsWith('__AXION_IPC__:')) {
                try {
                    var data = JSON.parse(document.title.substring(13));
                    document.title = data.title || '';
                } catch(e) {
                    document.title = '';
                }
            }
        })();
    "#;
    let _ = webview.eval(restore_title_script);
    
    // Читаем из менеджера - там должны быть актуальные данные от IPC
    let manager_info = {
        if let Ok(manager) = state.webview_manager.lock() {
            manager.get(&id).cloned()
        } else {
            None
        }
    };
    
    // Выбираем URL: приоритет у менеджера (обновляется через JS IPC), потом нативный
    let url = manager_info.as_ref()
        .map(|i| i.url.clone())
        .filter(|u| !u.is_empty() && u != "about:blank")
        .or_else(|| {
            // Если в менеджере Google Search URL, но нативный другой - используем нативный
            if !native_url.is_empty() && native_url != "about:blank" {
                Some(native_url.clone())
            } else {
                // Всё равно вернуть из менеджера даже если Google
                manager_info.as_ref().map(|i| i.url.clone())
            }
        })
        .unwrap_or(native_url);
    
    let title = manager_info.as_ref()
        .map(|i| i.title.clone())
        .filter(|t| !t.is_empty())
        .unwrap_or_else(|| extract_title_from_url(&url));
    
    let favicon = manager_info.as_ref()
        .and_then(|i| if i.favicon.is_empty() { None } else { Some(i.favicon.clone()) })
        .unwrap_or_default();
    
    Ok(WebViewInfo {
        id: id.clone(),
        url,
        title,
        favicon,
        is_loading: manager_info.as_ref().map(|i| i.is_loading).unwrap_or(false),
        can_go_back: manager_info.as_ref().map(|i| i.can_go_back).unwrap_or(true),
        can_go_forward: manager_info.as_ref().map(|i| i.can_go_forward).unwrap_or(false),
    })
}

/// Проверить существует ли WebView
#[tauri::command]
pub async fn webview_exists(
    app: AppHandle,
    id: String,
) -> Result<bool, String> {
    let webview_id = format!("webview_{}", id);
    Ok(app.get_webview(&webview_id).is_some())
}

/// DEBUG: Получить ВСЮ информацию о webview для отладки
#[tauri::command]
pub async fn debug_webview_info(
    app: AppHandle,
    id: String,
) -> Result<serde_json::Value, String> {
    let webview_id = format!("webview_{}", id);
    let state = app.state::<crate::AppState>();
    
    let webview = app.get_webview(&webview_id);
    let webview_exists = webview.is_some();
    
    let native_url = webview.as_ref()
        .and_then(|w| w.url().ok())
        .map(|u| u.to_string())
        .unwrap_or_else(|| "ERROR: could not get URL".to_string());
    
    let manager_info = {
        if let Ok(manager) = state.webview_manager.lock() {
            manager.get(&id).map(|i| serde_json::json!({
                "url": i.url,
                "title": i.title,
                "favicon": i.favicon,
                "is_loading": i.is_loading,
            }))
        } else {
            None
        }
    };
    
    Ok(serde_json::json!({
        "tab_id": id,
        "webview_id": webview_id,
        "webview_exists": webview_exists,
        "native_url": native_url,
        "manager_info": manager_info,
    }))
}

/// Получить title страницы из WebView
#[tauri::command]
pub async fn get_webview_title(
    app: AppHandle,
    id: String,
) -> Result<String, String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(_webview) = app.get_webview(&webview_id) {
        // Получаем title из менеджера (обновляется периодически)
        let state = app.state::<crate::AppState>();
        if let Ok(manager) = state.webview_manager.lock() {
            if let Some(info) = manager.get(&id) {
                return Ok(info.title.clone());
            }
        };
    }
    
    Err("WebView not found".to_string())
}
