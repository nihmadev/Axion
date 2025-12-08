
use tauri::{AppHandle, Manager, Emitter};
use crate::scripts::PAGE_OBSERVER_SCRIPT;
use super::types::WebViewUpdateEvent;
pub async fn poll_webview_state(app: AppHandle, id: String) {
    let webview_id = format!("webview_{}", id);
    let mut last_js_url = String::new();
    let mut iteration = 0u32;
    let mut idle_iterations = 0u32;
    let mut observer_injected = false;
    
    tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
    
    loop {
        let webview = match app.get_webview(&webview_id) {
            Some(wv) => wv,
            None => break,
        };
        
        let is_frozen = {
            let state = app.state::<crate::AppState>();
            let result = if let Ok(frozen_tabs) = state.frozen_tabs.lock() {
                frozen_tabs.contains(&id)
            } else {
                false
            };
            result
        };
        
        if is_frozen {
            break;
        }
        
        iteration = iteration.wrapping_add(1);
        
        if !observer_injected || iteration % 20 == 0 {
            let _ = webview.eval(PAGE_OBSERVER_SCRIPT);
            observer_injected = true;
        }
        
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
        
        let url_changed = !manager_url.is_empty() && manager_url != "about:blank" && manager_url != last_js_url;
        
        if url_changed {
            last_js_url = manager_url.clone();
            idle_iterations = 0;
            observer_injected = false;
            
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
        
        let sleep_duration = if iteration < 10 {
            200
        } else if idle_iterations > 100 {
            3000
        } else if idle_iterations > 30 {
            2000
        } else if idle_iterations > 10 {
            1000
        } else {
            500
        };
        
        tokio::time::sleep(tokio::time::Duration::from_millis(sleep_duration)).await;
    }
}
pub fn extract_filename_from_url(url: &str) -> String {
    if let Ok(parsed) = url::Url::parse(url) {
        for (key, value) in parsed.query_pairs() {
            let key_lower = key.to_lowercase();
            if key_lower == "filename" || key_lower == "name" || key_lower == "file" {
                let decoded = urlencoding::decode(&value).unwrap_or_else(|_| value.clone());
                if !decoded.is_empty() && decoded.contains('.') {
                    return decoded.to_string();
                }
            }
        }
        
        if let Some(segments) = parsed.path_segments() {
            if let Some(last) = segments.last() {
                let decoded = urlencoding::decode(last).unwrap_or_else(|_| last.into());
                if !decoded.is_empty() && decoded != "/" {
                    let clean_name = decoded.split('?').next().unwrap_or(&decoded);
                    
                    if clean_name.contains('.') {
                        return clean_name.to_string();
                    }
                    
                    if !clean_name.is_empty() {
                        let url_lower = url.to_lowercase();
                        let ext = if url_lower.contains("image") || url_lower.contains("/img/") || url_lower.contains("/photo") {
                            ".jpg"
                        } else if url_lower.contains("/video") {
                            ".mp4"
                        } else if url_lower.contains("/audio") || url_lower.contains("/music") {
                            ".mp3"
                        } else if url_lower.contains(".exe") || url_lower.contains("download") && url_lower.contains("windows") {
                            ".exe"
                        } else {
                            ""
                        };
                        
                        if !ext.is_empty() {
                            return format!("{}{}", clean_name, ext);
                        }
                        
                        return clean_name.to_string();
                    }
                }
            }
        }
        
        if let Some(host) = parsed.host_str() {
            let domain = host.split('.').next().unwrap_or("download");
            return format!("{}_{}.bin", domain, chrono::Utc::now().timestamp());
        }
    }
    
    format!("download_{}", chrono::Utc::now().timestamp())
}
pub fn extract_title_from_url(url: &str) -> String {
    if let Ok(parsed) = url::Url::parse(url) {
        let host = parsed.host_str().unwrap_or("");
        
        let clean_host = host.strip_prefix("www.").unwrap_or(host);
        
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
