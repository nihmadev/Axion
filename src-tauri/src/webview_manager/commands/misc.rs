//! Прочие команды WebView (zoom, script execution, page info update, PiP)

use tauri::{AppHandle, Manager, Emitter};
use crate::webview_manager::types::WebViewUpdateEvent;

/// JavaScript для активации Picture-in-Picture режима
const PIP_SCRIPT: &str = r#"
(function() {
    // Находим все видео на странице
    const videos = document.querySelectorAll('video');
    
    if (videos.length === 0) {
        console.log('PiP: No videos found on page');
        return { success: false, error: 'no_videos' };
    }
    
    // Ищем активное видео (играющее или с наибольшей площадью)
    let targetVideo = null;
    let maxArea = 0;
    
    for (const video of videos) {
        // Проверяем, не скрыто ли видео
        const rect = video.getBoundingClientRect();
        const style = window.getComputedStyle(video);
        
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0) {
            continue;
        }
        
        // Приоритет играющему видео
        if (!video.paused && !video.ended) {
            targetVideo = video;
            break;
        }
        
        // Иначе выбираем самое большое видео
        const area = rect.width * rect.height;
        if (area > maxArea) {
            maxArea = area;
            targetVideo = video;
        }
    }
    
    if (!targetVideo) {
        console.log('PiP: No suitable video found');
        return { success: false, error: 'no_suitable_video' };
    }
    
    // Проверяем поддержку PiP
    if (!document.pictureInPictureEnabled) {
        console.log('PiP: Not supported by browser');
        return { success: false, error: 'not_supported' };
    }
    
    // Проверяем, не запрещён ли PiP для этого видео
    if (targetVideo.disablePictureInPicture) {
        console.log('PiP: Disabled for this video');
        return { success: false, error: 'disabled' };
    }
    
    // Если уже в PiP режиме - выходим из него
    if (document.pictureInPictureElement === targetVideo) {
        document.exitPictureInPicture()
            .then(() => console.log('PiP: Exited'))
            .catch(e => console.error('PiP exit error:', e));
        return { success: true, action: 'exit' };
    }
    
    // Активируем PiP
    targetVideo.requestPictureInPicture()
        .then(() => console.log('PiP: Activated'))
        .catch(e => console.error('PiP error:', e));
    
    return { success: true, action: 'enter' };
})();
"#;

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

/// Активация Picture-in-Picture режима для видео на странице
#[tauri::command]
pub async fn toggle_pip(
    app: AppHandle,
    id: String,
) -> Result<(), String> {
    let webview_id = format!("webview_{}", id);
    
    if let Some(webview) = app.get_webview(&webview_id) {
        webview.eval(PIP_SCRIPT)
            .map_err(|e| format!("PiP activation failed: {}", e))?;
    } else {
        return Err("WebView not found".to_string());
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
