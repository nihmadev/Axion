//! Периодическая проверка состояния WebView

use tauri::{AppHandle, Manager, Emitter};
use crate::scripts::PAGE_OBSERVER_SCRIPT;
use super::types::WebViewUpdateEvent;

/// Периодическая проверка состояния WebView и инжекция observer скрипта
/// 
/// ВАЖНО: webview.url() может НЕ обновляться при клиентской навигации (Google redirects)!
/// Поэтому мы агрессивно инжектируем скрипт на КАЖДОЙ итерации.
pub async fn poll_webview_state(app: AppHandle, id: String) {
    let webview_id = format!("webview_{}", id);
    let mut last_js_url = String::new();
    let mut iteration = 0u32;
    
    // Даём время на начальную загрузку страницы
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
    
    loop {
        // Проверяем существует ли ещё WebView
        let webview = match app.get_webview(&webview_id) {
            Some(wv) => wv,
            None => break,
        };
        
        iteration = iteration.wrapping_add(1);
        
        // ВСЕГДА инжектируем скрипт на КАЖДОЙ итерации
        // Скрипт сам проверяет __AXION_OBSERVER_INITIALIZED__ чтобы не дублироваться
        // Это критично для обнаружения навигации когда webview.url() не обновляется
        let _ = webview.eval(PAGE_OBSERVER_SCRIPT);
        
        // Каждые 3 итерации принудительно запрашиваем обновление через JS
        // Это гарантирует что мы получим актуальный URL даже если обычный механизм не работает
        if iteration % 3 == 0 {
            let force_update = r#"
                (function() {
                    if (!window.__AXION_OBSERVER_INITIALIZED__) return;
                    var url = window.location.href;
                    var title = document.title || '';
                    var favicon = '';
                    var iconLink = document.querySelector('link[rel="icon"]') || 
                                  document.querySelector('link[rel="shortcut icon"]');
                    if (iconLink) favicon = iconLink.href;
                    if (!favicon) try { favicon = new URL('/favicon.ico', window.location.origin).href; } catch(e) {}
                    
                    var data = JSON.stringify({url: url, title: title, favicon: favicon});
                    var orig = document.title;
                    document.title = '__AXION_IPC__:' + data;
                    setTimeout(function() { document.title = orig || title; }, 30);
                })();
            "#;
            let _ = webview.eval(force_update);
        }
        
        // Получаем данные из менеджера (обновляется через IPC от page observer)
        let (manager_url, title, favicon) = {
            let state = app.state::<crate::AppState>();
            let guard = state.webview_manager.lock();
            if let Ok(manager) = guard {
                if let Some(info) = manager.get(&id) {
                    (info.url.clone(), info.title.clone(), info.favicon.clone())
                } else {
                    (String::new(), String::new(), String::new())
                }
            } else {
                (String::new(), String::new(), String::new())
            }
        };
        
        // Если URL изменился - эмитим событие на фронтенд
        // Приоритет у данных из page observer (manager_url), т.к. они содержат реальные URL после SPA навигации
        if !manager_url.is_empty() && manager_url != "about:blank" && manager_url != last_js_url {
            last_js_url = manager_url.clone();
            
            // Отправляем событие на фронтенд с реальными данными страницы
            let _ = app.emit("webview-url-changed", WebViewUpdateEvent {
                id: id.clone(),
                url: Some(manager_url.clone()),
                title: Some(if title.is_empty() { extract_title_from_url(&manager_url) } else { title }),
                favicon: if favicon.is_empty() { None } else { Some(favicon) },
                is_loading: Some(false),
                can_go_back: None,
                can_go_forward: None,
            });
        }
        
        // Быстрый polling для обнаружения навигации
        let sleep_duration = if iteration < 10 {
            150 // Очень быстро сначала
        } else if iteration < 30 {
            300 // Потом помедленнее
        } else {
            500 // Стабильный интервал
        };
        
        tokio::time::sleep(tokio::time::Duration::from_millis(sleep_duration)).await;
    }
}

/// Извлекает имя файла из URL для загрузки
pub fn extract_filename_from_url(url: &str) -> String {
    if let Ok(parsed) = url::Url::parse(url) {
        if let Some(segments) = parsed.path_segments() {
            if let Some(last) = segments.last() {
                let decoded = urlencoding::decode(last).unwrap_or_else(|_| last.into());
                if !decoded.is_empty() && decoded != "/" {
                    // Проверяем что это похоже на имя файла (есть расширение)
                    if decoded.contains('.') {
                        return decoded.to_string();
                    }
                }
            }
        }
    }
    
    // Fallback - генерируем имя с timestamp
    format!("download_{}", chrono::Utc::now().timestamp())
}

/// Извлекает читаемое название из URL (используется как fallback)
pub fn extract_title_from_url(url: &str) -> String {
    if let Ok(parsed) = url::Url::parse(url) {
        let host = parsed.host_str().unwrap_or("");
        
        // Убираем www. префикс
        let clean_host = host.strip_prefix("www.").unwrap_or(host);
        
        // Для известных сайтов возвращаем красивые названия
        match clean_host {
            "google.com" | "google.ru" => "Google".to_string(),
            "youtube.com" => "YouTube".to_string(),
            "github.com" => "GitHub".to_string(),
            "spotify.com" | "open.spotify.com" => "Spotify".to_string(),
            "twitter.com" | "x.com" => "X (Twitter)".to_string(),
            "facebook.com" => "Facebook".to_string(),
            "instagram.com" => "Instagram".to_string(),
            "reddit.com" => "Reddit".to_string(),
            "wikipedia.org" => "Wikipedia".to_string(),
            "amazon.com" => "Amazon".to_string(),
            "netflix.com" => "Netflix".to_string(),
            "twitch.tv" => "Twitch".to_string(),
            "discord.com" => "Discord".to_string(),
            "telegram.org" | "web.telegram.org" => "Telegram".to_string(),
            "vk.com" => "ВКонтакте".to_string(),
            "yandex.ru" | "ya.ru" => "Яндекс".to_string(),
            "mail.ru" => "Mail.ru".to_string(),
            _ => {
                // Для остальных - капитализируем первую букву домена
                let domain_name = clean_host.split('.').next().unwrap_or(clean_host);
                let mut chars = domain_name.chars();
                match chars.next() {
                    None => clean_host.to_string(),
                    Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
                }
            }
        }
    } else {
        url.to_string()
    }
}
