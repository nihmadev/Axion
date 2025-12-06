//! Picture-in-Picture команды

use tauri::{AppHandle, Manager};

/// JavaScript для активации Picture-in-Picture режима
const PIP_SCRIPT: &str = r#"
(async function() {
    console.log('PiP: Starting...');
    
    // Функция для поиска видео, включая shadow DOM
    function findAllVideos(root = document) {
        let videos = Array.from(root.querySelectorAll('video'));
        
        // Ищем в shadow DOM
        const allElements = root.querySelectorAll('*');
        for (const el of allElements) {
            if (el.shadowRoot) {
                videos = videos.concat(findAllVideos(el.shadowRoot));
            }
        }
        
        // Специально для YouTube - ищем видео в iframe
        const iframes = root.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                if (iframe.contentDocument) {
                    videos = videos.concat(findAllVideos(iframe.contentDocument));
                }
            } catch (e) {
                // Cross-origin iframe, пропускаем
            }
        }
        
        return videos;
    }
    
    // Находим все видео на странице
    const videos = findAllVideos();
    console.log('PiP: Found ' + videos.length + ' videos');
    
    if (videos.length === 0) {
        console.log('PiP: No videos found on page');
        alert('Видео не найдено на странице');
        return { success: false, error: 'no_videos' };
    }
    
    // Ищем активное видео (играющее или с наибольшей площадью)
    let targetVideo = null;
    let maxArea = 0;
    
    for (const video of videos) {
        // Проверяем, не скрыто ли видео
        const rect = video.getBoundingClientRect();
        const style = window.getComputedStyle(video);
        
        console.log('PiP: Checking video', {
            src: video.src || video.currentSrc,
            width: rect.width,
            height: rect.height,
            paused: video.paused,
            display: style.display,
            visibility: style.visibility
        });
        
        if (style.display === 'none' || style.visibility === 'hidden') {
            continue;
        }
        
        // Приоритет играющему видео
        if (!video.paused && !video.ended && rect.width > 0) {
            targetVideo = video;
            console.log('PiP: Selected playing video');
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
        alert('Подходящее видео не найдено');
        return { success: false, error: 'no_suitable_video' };
    }
    
    console.log('PiP: Target video selected', targetVideo.src || targetVideo.currentSrc);
    
    // Проверяем поддержку PiP
    if (!document.pictureInPictureEnabled) {
        console.log('PiP: Not supported by browser');
        alert('Picture-in-Picture не поддерживается');
        return { success: false, error: 'not_supported' };
    }
    
    // Проверяем, не запрещён ли PiP для этого видео
    if (targetVideo.disablePictureInPicture) {
        console.log('PiP: Disabled for this video by website');
        // Пробуем снять ограничение
        targetVideo.disablePictureInPicture = false;
    }
    
    // Если уже в PiP режиме - выходим из него
    if (document.pictureInPictureElement === targetVideo) {
        try {
            await document.exitPictureInPicture();
            console.log('PiP: Exited successfully');
            return { success: true, action: 'exit' };
        } catch (e) {
            console.error('PiP exit error:', e);
            return { success: false, error: e.message };
        }
    }
    
    // Активируем PiP
    try {
        await targetVideo.requestPictureInPicture();
        console.log('PiP: Activated successfully');
        return { success: true, action: 'enter' };
    } catch (e) {
        console.error('PiP error:', e.name, e.message);
        
        // Если ошибка user gesture - пробуем через play()
        if (e.name === 'NotAllowedError') {
            console.log('PiP: Trying alternative method via play()...');
            try {
                // Сначала запускаем воспроизведение (это может помочь с user gesture)
                if (targetVideo.paused) {
                    await targetVideo.play();
                }
                // Пробуем ещё раз
                await targetVideo.requestPictureInPicture();
                console.log('PiP: Activated via alternative method');
                return { success: true, action: 'enter' };
            } catch (e2) {
                console.error('PiP alternative method failed:', e2);
                alert('Не удалось активировать Picture-in-Picture: ' + e2.message);
            }
        } else {
            alert('Ошибка Picture-in-Picture: ' + e.message);
        }
        
        return { success: false, error: e.message };
    }
})();
"#;

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
