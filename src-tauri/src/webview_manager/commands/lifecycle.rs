//! Команды жизненного цикла WebView (создание, закрытие)

use tauri::{AppHandle, Manager, WebviewUrl, WebviewBuilder, LogicalPosition, LogicalSize, Emitter};
use tauri::webview::{PageLoadEvent, DownloadEvent};
use std::path::PathBuf;
use crate::webview_manager::types::{WebViewUpdateEvent, WebViewBounds};
use crate::webview_manager::polling::{poll_webview_state, extract_title_from_url, extract_filename_from_url};
use crate::webview_manager::CHROME_USER_AGENT;

/// Создание нового нативного WebView для вкладки (встроенного в главное окно)
#[tauri::command]
pub async fn create_webview(
    app: AppHandle,
    id: String,
    url: String,
    bounds: WebViewBounds,
) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    
    // Добавляем в менеджер
    {
        let mut manager = state.webview_manager.lock().map_err(|e| e.to_string())?;
        manager.add(id.clone(), url.clone());
    }
    
    // Сохраняем bounds сразу при создании
    {
        let mut bounds_map = state.webview_bounds.lock().map_err(|e| e.to_string())?;
        bounds_map.insert(id.clone(), bounds.clone());
    }

    // Создаём URL для WebView
    let webview_url = if url.is_empty() || url == "about:blank" {
        WebviewUrl::App("about:blank".into())
    } else {
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    };

    // Получаем главное окно
    let main_window = app.get_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    let webview_id = format!("webview_{}", id);
    
    // Клонируем для разных обработчиков
    let tab_id_nav = id.clone();
    let app_nav = app.clone();
    
    let tab_id_page = id.clone();
    let app_page = app.clone();
    
    let tab_id_title = id.clone();
    let app_title = app.clone();
    
    // Создаём WebView с оптимизированными настройками
    let builder = WebviewBuilder::new(&webview_id, webview_url)
        // Устанавливаем User-Agent для совместимости с Google
        .user_agent(CHROME_USER_AGENT)
        // Включаем аппаратное ускорение и оптимизации
        .auto_resize()
        // Разрешаем clipboard для копирования/вставки
        .enable_clipboard_access()
        // Обработчик навигации - срабатывает при начале навигации
        .on_navigation(move |nav_url| {
            let url_str = nav_url.to_string();
            let title = extract_title_from_url(&url_str);
            
            // Обновляем в менеджере ТОЛЬКО если там нет данных от page observer
            // page observer данные более точные для SPA навигации
            {
                let state = app_nav.state::<crate::AppState>();
                if let Ok(mut manager) = state.webview_manager.lock() {
                    // Проверяем есть ли уже более точные данные от page observer
                    let should_update = if let Some(existing_info) = manager.get(&tab_id_nav) {
                        existing_info.url.is_empty() || existing_info.url == "about:blank"
                    } else {
                        true // Если нет данных, обновляем
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
            true // Разрешаем навигацию
        })
        // Обработчик загрузки страницы - срабатывает при Started и Finished
        .on_page_load(move |_webview, payload| {
            let url_str = payload.url().to_string();
            
            // Пропускаем about:blank
            if url_str == "about:blank" {
                return;
            }
            
            let is_loading = matches!(payload.event(), PageLoadEvent::Started);
            let title = extract_title_from_url(&url_str);
            
            // Обновляем в менеджере ТОЛЬКО если там нет данных от page observer
            // page observer данные более точные для SPA навигации
            {
                let state = app_page.state::<crate::AppState>();
                if let Ok(mut manager) = state.webview_manager.lock() {
                    // Проверяем есть ли уже более точные данные от page observer
                    let should_update = if let Some(existing_info) = manager.get(&tab_id_page) {
                        existing_info.url.is_empty() || existing_info.url == "about:blank"
                    } else {
                        true // Если нет данных, обновляем
                    };
                    
                    if should_update {
                        manager.update_url(&tab_id_page, url_str.clone());
                        if !is_loading {
                            // Обновляем title только когда страница загружена
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
        // Обработчик загрузок - перехватываем загрузки из WebView
        .on_download({
            let app_download = app.clone();
            move |_webview, event| {
                match event {
                    DownloadEvent::Requested { url, destination } => {
                        // Конвертируем Url в String
                        let url_str = url.to_string();
                        
                        // Получаем папку загрузок
                        let downloads_dir = dirs::download_dir()
                            .unwrap_or_else(|| PathBuf::from("."));
                        
                        // Извлекаем имя файла из URL
                        let filename = extract_filename_from_url(&url_str);
                        let save_path = downloads_dir.join(&filename);
                        
                        // Устанавливаем путь сохранения
                        *destination = save_path.clone();
                        
                        // Генерируем ID загрузки
                        let download_id = format!("dl_{}", uuid::Uuid::new_v4().to_string().replace("-", "")[..12].to_string());
                        
                        // Создаём объект загрузки
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
                        
                        // Отправляем события о начале загрузки
                        let _ = app_download.emit("download-started", &download);
                        let _ = app_download.emit("download-update", &download);
                        
                        // Сохраняем информацию о загрузке для отслеживания завершения
                        // Используем URL как ключ для связи с событием Finished
                        {
                            let state = app_download.state::<crate::AppState>();
                            if let Ok(mut downloads) = state.downloads.lock() {
                                downloads.insert(url_str.clone(), crate::downloads::Download {
                                    id: download_id,
                                    filename: filename.clone(),
                                    url: url_str.clone(),
                                    total_bytes: -1,
                                    received_bytes: 0,
                                    state: "progressing".to_string(),
                                    start_time: chrono::Utc::now().timestamp_millis(),
                                    save_path: Some(save_path.to_string_lossy().to_string()),
                                    speed: 0,
                                    mime_type: None,
                                });
                            };
                        }
                        
                        true // Разрешаем загрузку
                    }
                    DownloadEvent::Finished { url, path, success } => {
                        // Конвертируем Url в String
                        let url_str = url.to_string();
                        
                        // Получаем информацию о загрузке по URL
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
                            
                            // Получаем размер файла если загрузка успешна
                            if success {
                                if let Some(ref p) = path {
                                    if let Ok(metadata) = std::fs::metadata(p) {
                                        dl.total_bytes = metadata.len() as i64;
                                        dl.received_bytes = metadata.len() as i64;
                                    }
                                }
                            }
                            
                            // Отправляем события о завершении
                            let _ = app_download.emit("download-update", &dl);
                            let _ = app_download.emit("download-completed", &dl);
                            
                            // Сохраняем в историю загрузок
                            let dl_clone = dl.clone();
                            tauri::async_runtime::spawn(async move {
                                if let Ok(mut downloads) = crate::downloads::get_downloads().await {
                                    // Проверяем, нет ли уже такой загрузки
                                    if !downloads.iter().any(|d| d.id == dl_clone.id) {
                                        downloads.insert(0, dl_clone);
                                        let _ = crate::downloads::save_downloads(downloads).await;
                                    } else {
                                        // Обновляем существующую
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
        // Обработчик изменения title - срабатывает когда document.title меняется
        // Также используется как IPC канал для получения реальных URL/title/favicon от page_observer.js
        .on_document_title_changed(move |_webview, title| {
            // Проверяем специальный IPC формат от page_observer.js
            // Формат: __AXION_IPC__:{"url":"...","title":"...","favicon":"..."}
            if let Some(json_str) = title.strip_prefix("__AXION_IPC__:") {
                // Парсим JSON с данными страницы
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
                    
                    // Обновляем в менеджере с реальными данными
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
                    
                    // Отправляем событие с реальными данными
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
            
            // Обычное изменение title (не IPC)
            // Игнорируем пустые title - они могут быть временными
            if title.is_empty() {
                return;
            }
            
            // Для обычных изменений title используем данные из менеджера
            // (URL уже должен быть обновлён через IPC)
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

    // Запускаем периодическую проверку состояния WebView
    let app_for_polling = app.clone();
    let id_for_polling = id.clone();
    tauri::async_runtime::spawn(async move {
        // Даём время на загрузку
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        poll_webview_state(app_for_polling, id_for_polling).await;
    });

    Ok(())
}

/// Закрытие WebView
#[tauri::command]
pub async fn close_webview(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let state = app.state::<crate::AppState>();
    
    // Удаляем из менеджера
    {
        let mut manager = state.webview_manager.lock().map_err(|e| e.to_string())?;
        manager.remove(&id);
    }

    // Закрываем WebView (получаем его из главного окна)
    let webview_id = format!("webview_{}", id);
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.close().map_err(|e| format!("Failed to close webview: {}", e))?;
    }

    Ok(())
}
