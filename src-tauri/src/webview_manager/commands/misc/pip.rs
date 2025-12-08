
use tauri::{AppHandle, Manager};
const PIP_SCRIPT: &str = r#"
(async function() {
    console.log('PiP: Starting...');
    
    function findAllVideos(root = document) {
        let videos = Array.from(root.querySelectorAll('video'));
        
        const allElements = root.querySelectorAll('*');
        for (const el of allElements) {
            if (el.shadowRoot) {
                videos = videos.concat(findAllVideos(el.shadowRoot));
            }
        }
        
        const iframes = root.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                if (iframe.contentDocument) {
                    videos = videos.concat(findAllVideos(iframe.contentDocument));
                }
            } catch (e) {
            }
        }
        
        return videos;
    }
    
    const videos = findAllVideos();
    console.log('PiP: Found ' + videos.length + ' videos');
    
    if (videos.length === 0) {
        console.log('PiP: No videos found on page');
        alert('No videos found on this page');
        return { success: false, error: 'no_videos' };
    }
    
    let targetVideo = null;
    let maxArea = 0;
    
    for (const video of videos) {
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
        
        if (!video.paused && !video.ended && rect.width > 0) {
            targetVideo = video;
            console.log('PiP: Selected playing video');
            break;
        }
        
        const area = rect.width * rect.height;
        if (area > maxArea) {
            maxArea = area;
            targetVideo = video;
        }
    }
    
    if (!targetVideo) {
        console.log('PiP: No suitable video found');
        alert('No suitable video found');
        return { success: false, error: 'no_suitable_video' };
    }
    
    console.log('PiP: Target video selected', targetVideo.src || targetVideo.currentSrc);
    
    if (!document.pictureInPictureEnabled) {
        console.log('PiP: Not supported by browser');
        alert('Picture-in-Picture is not supported');
        return { success: false, error: 'not_supported' };
    }
    
    if (targetVideo.disablePictureInPicture) {
        console.log('PiP: Disabled for this video by website');
        targetVideo.disablePictureInPicture = false;
    }
    
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
    
    try {
        await targetVideo.requestPictureInPicture();
        console.log('PiP: Activated successfully');
        return { success: true, action: 'enter' };
    } catch (e) {
        console.error('PiP error:', e.name, e.message);
        
        if (e.name === 'NotAllowedError') {
            console.log('PiP: Trying alternative method via play()...');
            try {
                if (targetVideo.paused) {
                    await targetVideo.play();
                }
                await targetVideo.requestPictureInPicture();
                console.log('PiP: Activated via alternative method');
                return { success: true, action: 'enter' };
            } catch (e2) {
                console.error('PiP alternative method failed:', e2);
                alert('Failed to activate Picture-in-Picture: ' + e2.message);
            }
        } else {
            alert('Picture-in-Picture error: ' + e.message);
        }
        
        return { success: false, error: e.message };
    }
})();
"#;
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
