use tauri::{Window, Emitter};

#[tauri::command]
pub async fn window_minimize(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_maximize(window: Window) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn window_close(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_fullscreen(window: Window) -> Result<(), String> {
    use windows::Win32::UI::WindowsAndMessaging::{
        SetWindowPos, GetSystemMetrics, SetWindowLongW,
        HWND_TOPMOST, SWP_FRAMECHANGED, SWP_SHOWWINDOW, SWP_NOZORDER,
        SM_CXSCREEN, SM_CYSCREEN, GWL_STYLE, GWL_EXSTYLE,
        WS_POPUP, WS_VISIBLE, WS_EX_TOPMOST,
    };
    use windows::Win32::Foundation::HWND;
    
    let is_fullscreen = window.is_fullscreen().unwrap_or(false);
    
    if !is_fullscreen {
        if let Ok(hwnd) = window.hwnd() {
            unsafe {
                let hwnd = HWND(hwnd.0 as *mut _);
                let screen_width = GetSystemMetrics(SM_CXSCREEN);
                let screen_height = GetSystemMetrics(SM_CYSCREEN);
                
                SetWindowLongW(hwnd, GWL_STYLE, (WS_POPUP | WS_VISIBLE).0 as i32);
                SetWindowLongW(hwnd, GWL_EXSTYLE, WS_EX_TOPMOST.0 as i32);
                
                let _ = SetWindowPos(
                    hwnd,
                    HWND_TOPMOST,
                    0,
                    0,
                    screen_width,
                    screen_height,
                    SWP_FRAMECHANGED | SWP_SHOWWINDOW,
                );
            }
        }
        
        window.set_fullscreen(true).map_err(|e| e.to_string())?;
    } else {
        window.set_fullscreen(false).map_err(|e| e.to_string())?;
        
        if let Ok(hwnd) = window.hwnd() {
            unsafe {
                use windows::Win32::UI::WindowsAndMessaging::{
                    WS_OVERLAPPEDWINDOW, HWND_NOTOPMOST,
                };
                
                let hwnd = HWND(hwnd.0 as *mut _);
                
                SetWindowLongW(hwnd, GWL_STYLE, (WS_OVERLAPPEDWINDOW | WS_VISIBLE).0 as i32);
                SetWindowLongW(hwnd, GWL_EXSTYLE, 0);
                
                let _ = SetWindowPos(
                    hwnd,
                    HWND_NOTOPMOST,
                    0,
                    0,
                    0,
                    0,
                    SWP_FRAMECHANGED | SWP_SHOWWINDOW | SWP_NOZORDER,
                );
            }
        }
        
        let _ = window.maximize();
    }
    
    window.emit("fullscreen-change", !is_fullscreen).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn is_fullscreen(window: Window) -> Result<bool, String> {
    window.is_fullscreen().map_err(|e| e.to_string())
}
