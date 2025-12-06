//! Периодическая проверка состояния WebView

use tauri::{AppHandle, Manager, Emitter};
use crate::scripts::PAGE_OBSERVER_SCRIPT;
use super::types::WebViewUpdateEvent;

/// Периодическая проверка состояния WebView и инжекция observer скрипта
/// 
/// ВАЖНО: webview.url() может НЕ обновляться при клиентской навигации (Google redirects)!
/// Поэтому мы инжектируем скрипт периодически, но с оптимизацией для экономии памяти.
pub async fn poll_webview_state(app: AppHandle, id: String) {
    let webview_id = format!("webview_{}", id);
    let mut last_js_url = String::new();
    let mut iteration = 0u32;
    let mut idle_iterations = 0u32; // Счётчик итераций без изменений
    let mut observer_injected = false;
    
    // Даём время на начальную загрузку страницы
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
    
    loop {
        // Проверяем существует ли ещё WebView
        let webview = match app.get_webview(&webview_id) {
            Some(wv) => wv,
            None => break,
        };
        
        // Проверяем, не заморожена ли вкладка
        let is_frozen = {
            let state = app.state::<crate::AppState>();
            let result = if let Ok(frozen_tabs) = state.frozen_tabs.lock() {
                frozen_tabs.contains(&id)
            } else {
                false
            };
            result
        };
        
        // Если вкладка заморожена - прекращаем polling
        if is_frozen {
            break;
        }
        
        iteration = iteration.wrapping_add(1);
        
        // Инжектируем observer только если ещё не инжектирован или после навигации
        // Скрипт сам проверяет __AXION_OBSERVER_INITIALIZED__
        if !observer_injected || iteration % 20 == 0 {
            let _ = webview.eval(PAGE_OBSERVER_SCRIPT);
            observer_injected = true;
        }
        
        // Запрашиваем обновление реже - каждые 10 итераций вместо 3
        if iteration % 10 == 0 {
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
        let url_changed = !manager_url.is_empty() && manager_url != "about:blank" && manager_url != last_js_url;
        
        if url_changed {
            last_js_url = manager_url.clone();
            idle_iterations = 0; // Сбрасываем счётчик при изменении
            observer_injected = false; // Переинжектируем после навигации
            
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
        } else {
            idle_iterations += 1;
        }
        
        // Адаптивный интервал polling для экономии ресурсов
        let sleep_duration = if iteration < 10 {
            200 // Быстро в начале для первой загрузки
        } else if idle_iterations > 100 {
            3000 // Очень медленно если долго нет изменений (3 сек)
        } else if idle_iterations > 30 {
            2000 // Медленнее если нет активности (2 сек)
        } else if idle_iterations > 10 {
            1000 // Умеренно (1 сек)
        } else {
            500 // Стандартный интервал
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
