
use tauri::{AppHandle, Manager, WebviewUrl, WebviewBuilder, LogicalPosition, LogicalSize, Emitter};
use tauri::webview::{PageLoadEvent, DownloadEvent};
use std::path::PathBuf;
use crate::webview_manager::types::{WebViewUpdateEvent, WebViewBounds};
use crate::webview_manager::polling::{poll_webview_state, extract_title_from_url, extract_filename_from_url};
use crate::webview_manager::CHROME_USER_AGENT;
use crate::adblock;
fn get_filename_from_headers(url: &str) -> Option<String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent(CHROME_USER_AGENT)
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .ok()?;
    
    let response = client.head(url).send().ok()?;
    let headers = response.headers();
    
    if let Some(cd) = headers.get("content-disposition") {
        if let Ok(cd_str) = cd.to_str() {
            if let Some(start) = cd_str.find("filename*=") {
                let rest = &cd_str[start + 10..];
                let encoded = if let Some(pos) = rest.find("''") {
                    &rest[pos + 2..]
                } else {
                    rest
                };
                let end = encoded.find(';').unwrap_or(encoded.len());
                let encoded_name = encoded[..end].trim().trim_matches('"');
                if let Ok(decoded) = urlencoding::decode(encoded_name) {
                    if !decoded.is_empty() {
                        return Some(decoded.to_string());
                    }
                }
            }
            
            if let Some(start) = cd_str.find("filename=") {
                let rest = &cd_str[start + 9..];
                let filename = if rest.starts_with('"') {
                    rest[1..].split('"').next().unwrap_or("")
                } else {
                    rest.split(';').next().unwrap_or("").trim()
                };
                if !filename.is_empty() {
                    let decoded = urlencoding::decode(filename).unwrap_or_else(|_| filename.into());
                    return Some(decoded.to_string());
                }
            }
        }
    }
    
    None
}
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
            let url_str = nav_url.to_string();
            
            let source_url: String = {
                let state = app_nav.state::<crate::AppState>();
                let result = if let Ok(manager) = state.webview_manager.lock() {
                    manager.get(&tab_id_nav)
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
                let state = app_nav.state::<crate::AppState>();
                if let Ok(mut manager) = state.webview_manager.lock() {
                    let should_update = if let Some(existing_info) = manager.get(&tab_id_nav) {
                        existing_info.url.is_empty() || existing_info.url == "about:blank"
                    } else {
                        true
                    };
                    
                    if should_update {
                        manager.update_url(&tab_id_nav, url_str.clone());
                        manager.update_title(&tab_id_nav, title.clone());
                    }
                };
            }
            
            let _ = app_nav.emit("webview-url-changed", WebViewUpdateEvent {
                id: tab_id_nav.clone(),
                url: Some(url_str),
                title: Some(title),
                favicon: None,
                is_loading: Some(true),
                can_go_back: None,
                can_go_forward: None,
            });
            true
        })
        .on_page_load(move |_webview, payload| {
            let url_str = payload.url().to_string();
            
            if url_str == "about:blank" {
                return;
            }
            
            let is_loading = matches!(payload.event(), PageLoadEvent::Started);
            let title = extract_title_from_url(&url_str);
            
            {
                let state = app_page.state::<crate::AppState>();
                if let Ok(mut manager) = state.webview_manager.lock() {
                    let should_update = if let Some(existing_info) = manager.get(&tab_id_page) {
                        existing_info.url.is_empty() || existing_info.url == "about:blank"
                    } else {
                        true
                    };
                    
                    if should_update {
                        manager.update_url(&tab_id_page, url_str.clone());
                        if !is_loading {
                            manager.update_title(&tab_id_page, title.clone());
                        }
                    }
                };
            }
            
            let _ = app_page.emit("webview-url-changed", WebViewUpdateEvent {
                id: tab_id_page.clone(),
                url: Some(url_str),
                title: Some(title),
                favicon: None,
                is_loading: Some(is_loading),
                can_go_back: None,
                can_go_forward: None,
            });
        })
        .on_download({
            let app_download = app.clone();
            move |_webview, event| {
                match event {
                    DownloadEvent::Requested { url, destination } => {
                        let url_str = url.to_string();
                        
                        let downloads_dir = dirs::download_dir()
                            .unwrap_or_else(|| PathBuf::from("."));
                        
                        let filename = get_filename_from_headers(&url_str)
                            .unwrap_or_else(|| extract_filename_from_url(&url_str));
                        
                        let filename = crate::downloads::utils::get_unique_filename(&downloads_dir, &filename);
                        let save_path = downloads_dir.join(&filename);
                        
                        *destination = save_path.clone();
                        
                        let download_id = format!("dl_{}", uuid::Uuid::new_v4().to_string().replace("-", "")[..12].to_string());
                        
                        let download = serde_json::json!({
                            "id": download_id,
                            "filename": filename,
                            "url": url_str,
                            "totalBytes": -1,
                            "receivedBytes": 0,
                            "state": "progressing",
                            "startTime": chrono::Utc::now().timestamp_millis(),
                            "savePath": save_path.to_string_lossy().to_string(),
                            "speed": 0,
                            "mimeType": serde_json::Value::Null
                        });
                        
                        let _ = app_download.emit("download-started", &download);
                        let _ = app_download.emit("download-update", &download);
                        
                        let dl = crate::downloads::Download {
                            id: download_id.clone(),
                            filename: filename.clone(),
                            url: url_str.clone(),
                            total_bytes: -1,
                            received_bytes: 0,
                            state: "progressing".to_string(),
                            start_time: chrono::Utc::now().timestamp_millis(),
                            save_path: Some(save_path.to_string_lossy().to_string()),
                            speed: 0,
                            mime_type: None,
                        };
                        
                        {
                            let state = app_download.state::<crate::AppState>();
                            if let Ok(mut downloads) = state.downloads.lock() {
                                downloads.insert(url_str.clone(), dl.clone());
                            };
                        }
                        
                        let dl_for_save = dl.clone();
                        tauri::async_runtime::spawn(async move {
                            if let Ok(mut downloads) = crate::downloads::get_downloads().await {
                                downloads.insert(0, dl_for_save);
                                let _ = crate::downloads::save_downloads(downloads).await;
                            }
                        });
                        
                        true
                    }
                    DownloadEvent::Finished { url, path, success } => {
                        let url_str = url.to_string();
                        
                        let download_info = {
                            let state = app_download.state::<crate::AppState>();
                            let result = if let Ok(mut downloads) = state.downloads.lock() {
                                downloads.remove(&url_str)
                            } else {
                                None
                            };
                            result
                        };
                        
                        if let Some(mut dl) = download_info {
                            dl.state = if success { "completed".to_string() } else { "interrupted".to_string() };
                            
                            if success {
                                if let Some(ref p) = path {
                                    if let Ok(metadata) = std::fs::metadata(p) {
                                        dl.total_bytes = metadata.len() as i64;
                                        dl.received_bytes = metadata.len() as i64;
                                    }
                                }
                            }
                            
                            let _ = app_download.emit("download-update", &dl);
                            let _ = app_download.emit("download-completed", &dl);
                            
                            let dl_clone = dl.clone();
                            tauri::async_runtime::spawn(async move {
                                if let Ok(mut downloads) = crate::downloads::get_downloads().await {
                                    if !downloads.iter().any(|d| d.id == dl_clone.id) {
                                        downloads.insert(0, dl_clone);
                                        let _ = crate::downloads::save_downloads(downloads).await;
                                    } else {
                                        if let Some(existing) = downloads.iter_mut().find(|d| d.id == dl_clone.id) {
                                            *existing = dl_clone;
                                        }
                                        let _ = crate::downloads::save_downloads(downloads).await;
                                    }
                                }
                            });
                        }
                        
                        true
                    }
                    _ => true,
                }
            }
        })
        .on_document_title_changed(move |_webview, title| {
            if let Some(json_str) = title.strip_prefix("__AXION_AUTOFILL__:") {
                let _ = app_title.emit("autofill-message", serde_json::json!({
                    "id": tab_id_title.clone(),
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
                        let state = app_title.state::<crate::AppState>();
                        if let Ok(mut manager) = state.webview_manager.lock() {
                            manager.update_url(&tab_id_title, url.clone());
                            manager.update_title(&tab_id_title, real_title.clone());
                            if let Some(ref fav) = favicon {
                                if !fav.is_empty() {
                                    manager.update_favicon(&tab_id_title, fav.clone());
                                }
                            }
                        };
                    }
                    
                    let _ = app_title.emit("webview-url-changed", WebViewUpdateEvent {
                        id: tab_id_title.clone(),
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
            
            let state = app_title.state::<crate::AppState>();
            if let Ok(mut manager) = state.webview_manager.lock() {
                if let Some(info) = manager.get(&tab_id_title) {
                    let url = info.url.clone();
                    if url.is_empty() || url == "about:blank" {
                        return;
                    }
                    
                    manager.update_title(&tab_id_title, title.clone());
                    
                    let _ = app_title.emit("webview-url-changed", WebViewUpdateEvent {
                        id: tab_id_title.clone(),
                        url: Some(url),
                        title: Some(title),
                        favicon: None,
                        is_loading: Some(false),
                        can_go_back: None,
                        can_go_forward: None,
                    });
                }
            };
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
