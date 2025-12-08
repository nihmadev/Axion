use tauri::{AppHandle, Manager, WebviewUrl, WebviewBuilder, LogicalPosition, LogicalSize, Emitter};
use tauri::webview::PageLoadEvent;
use crate::webview_manager::types::{WebViewUpdateEvent, WebViewBounds};
use crate::webview_manager::polling::{poll_webview_state, extract_title_from_url};
use crate::webview_manager::CHROME_USER_AGENT;
use crate::adblock;
use super::download_handler::handle_download;

#[tauri::command]
pub async fn create_webview(
    app: AppHandle,
    id: String,
    url: String,
    bounds: WebViewBounds,
) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    
    {
        let mut manager = state.webview_manager.lock().map_err(|e| e.to_string())?;
        manager.add(id.clone(), url.clone());
    }
    
    {
        let mut bounds_map = state.webview_bounds.lock().map_err(|e| e.to_string())?;
        bounds_map.insert(id.clone(), bounds.clone());
    }

    let webview_url = if url.is_empty() || url == "about:blank" {
        WebviewUrl::App("about:blank".into())
    } else {
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    };

    let main_window = app.get_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    let webview_id = format!("webview_{}", id);
    
    let tab_id_nav = id.clone();
    let app_nav = app.clone();
    
    let tab_id_page = id.clone();
    let app_page = app.clone();
    
    let tab_id_title = id.clone();
    let app_title = app.clone();
    
    let builder = WebviewBuilder::new(&webview_id, webview_url)
        .user_agent(CHROME_USER_AGENT)
        .auto_resize()
        .enable_clipboard_access()
        .on_navigation(move |nav_url| {
            handle_navigation(&app_nav, &tab_id_nav, nav_url.clone())
        })
        .on_page_load(move |_webview, payload| {
            handle_page_load(&app_page, &tab_id_page, payload);
        })
        .on_download(handle_download(app.clone()))
        .on_document_title_changed(move |_webview, title| {
            handle_title_changed(&app_title, &tab_id_title, title);
        });
    
    main_window.add_child(
        builder,
        LogicalPosition::new(bounds.x, bounds.y),
        LogicalSize::new(bounds.width, bounds.height),
    ).map_err(|e| format!("Failed to add webview to window: {}", e))?;

    let app_for_polling = app.clone();
    let id_for_polling = id.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        poll_webview_state(app_for_polling, id_for_polling).await;
    });

    Ok(())
}

fn handle_navigation(app: &AppHandle, tab_id: &str, nav_url: url::Url) -> bool {
    let url_str = nav_url.to_string();
    
    let source_url: String = {
        let state = app.state::<crate::AppState>();
        let result = if let Ok(manager) = state.webview_manager.lock() {
            manager.get(tab_id)
                .map(|info| info.url.clone())
                .unwrap_or_default()
        } else {
            String::new()
        };
        result
    };
    
    if adblock::should_block_url(&url_str, &source_url, "document") {
        println!("[AdBlock] Blocked navigation: {}", url_str);
        return false;
    }
    
    let title = extract_title_from_url(&url_str);
    
    {
        let state = app.state::<crate::AppState>();
        if let Ok(mut manager) = state.webview_manager.lock() {
            let should_update = if let Some(existing_info) = manager.get(tab_id) {
                existing_info.url.is_empty() || existing_info.url == "about:blank"
            } else {
                true
            };
            
            if should_update {
                manager.update_url(tab_id, url_str.clone());
                manager.update_title(tab_id, title.clone());
            }
        };
    }
    
    let _ = app.emit("webview-url-changed", WebViewUpdateEvent {
        id: tab_id.to_string(),
        url: Some(url_str),
        title: Some(title),
        favicon: None,
        is_loading: Some(true),
        can_go_back: None,
        can_go_forward: None,
    });
    true
}

fn handle_page_load(app: &AppHandle, tab_id: &str, payload: tauri::webview::PageLoadPayload<'_>) {
    let url_str = payload.url().to_string();
    
    if url_str == "about:blank" {
        return;
    }
    
    let is_loading = matches!(payload.event(), PageLoadEvent::Started);
    let title = extract_title_from_url(&url_str);
    
    {
        let state = app.state::<crate::AppState>();
        if let Ok(mut manager) = state.webview_manager.lock() {
            let should_update = if let Some(existing_info) = manager.get(tab_id) {
                existing_info.url.is_empty() || existing_info.url == "about:blank"
            } else {
                true
            };
            
            if should_update {
                manager.update_url(tab_id, url_str.clone());
                if !is_loading {
                    manager.update_title(tab_id, title.clone());
                }
            }
        };
    }
    
    let _ = app.emit("webview-url-changed", WebViewUpdateEvent {
        id: tab_id.to_string(),
        url: Some(url_str),
        title: Some(title),
        favicon: None,
        is_loading: Some(is_loading),
        can_go_back: None,
        can_go_forward: None,
    });
}

fn handle_title_changed(app: &AppHandle, tab_id: &str, title: String) {
    if let Some(json_str) = title.strip_prefix("__AXION_AUTOFILL__:") {
        let _ = app.emit("autofill-message", serde_json::json!({
            "id": tab_id,
            "message": json_str,
        }));
        return;
    }
    
    if let Some(json_str) = title.strip_prefix("__AXION_IPC__:") {
        if let Ok(page_data) = serde_json::from_str::<serde_json::Value>(json_str) {
            let url = page_data.get("url")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string();
            let real_title = page_data.get("title")
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string();
            let favicon = page_data.get("favicon")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());
            
            if url.is_empty() || url == "about:blank" {
                return;
            }
            
            {
                let state = app.state::<crate::AppState>();
                if let Ok(mut manager) = state.webview_manager.lock() {
                    manager.update_url(tab_id, url.clone());
                    manager.update_title(tab_id, real_title.clone());
                    if let Some(ref fav) = favicon {
                        if !fav.is_empty() {
                            manager.update_favicon(tab_id, fav.clone());
                        }
                    }
                };
            }
            
            let _ = app.emit("webview-url-changed", WebViewUpdateEvent {
                id: tab_id.to_string(),
                url: Some(url),
                title: Some(real_title),
                favicon,
                is_loading: Some(false),
                can_go_back: None,
                can_go_forward: None,
            });
        }
        return;
    }
    
    if title.is_empty() {
        return;
    }
    
    let state = app.state::<crate::AppState>();
    if let Ok(mut manager) = state.webview_manager.lock() {
        if let Some(info) = manager.get(tab_id) {
            let url = info.url.clone();
            if url.is_empty() || url == "about:blank" {
                return;
            }
            
            manager.update_title(tab_id, title.clone());
            
            let _ = app.emit("webview-url-changed", WebViewUpdateEvent {
                id: tab_id.to_string(),
                url: Some(url),
                title: Some(title),
                favicon: None,
                is_loading: Some(false),
                can_go_back: None,
                can_go_forward: None,
            });
        }
    };
}
