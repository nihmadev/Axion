// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod storage;
mod downloads;
mod webview_manager;
mod scripts;
mod adblock;

use tauri::{Manager, Emitter};
use std::sync::Mutex;
use webview_manager::WebViewManager;

pub struct AppState {
    pub frozen_tabs: Mutex<std::collections::HashSet<String>>,
    pub downloads: Mutex<std::collections::HashMap<String, downloads::Download>>,
    pub download_manager: Mutex<downloads::DownloadManager>,
    pub webview_manager: Mutex<WebViewManager>,
    pub webview_bounds: Mutex<std::collections::HashMap<String, webview_manager::WebViewBounds>>,
    pub startup_url: Mutex<Option<String>>,
}


fn main() {
    // Получаем URL из аргументов командной строки (для "Открыть с помощью")
    let args: Vec<String> = std::env::args().collect();
    let startup_url = if args.len() > 1 {
        let path = &args[1];
        // Проверяем, что это путь к файлу, а не флаг
        if !path.starts_with('-') && std::path::Path::new(path).exists() {
            // Конвертируем путь в file:/// URL
            let normalized = path.replace('\\', "/");
            Some(format!("file:///{}", normalized.trim_start_matches('/')))
        } else if path.starts_with("file:///") || path.starts_with("http://") || path.starts_with("https://") {
            Some(path.clone())
        } else {
            None
        }
    } else {
        None
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            frozen_tabs: Mutex::new(std::collections::HashSet::new()),
            downloads: Mutex::new(std::collections::HashMap::new()),
            download_manager: Mutex::new(downloads::DownloadManager::new()),
            webview_manager: Mutex::new(WebViewManager::new()),
            webview_bounds: Mutex::new(std::collections::HashMap::new()),
            startup_url: Mutex::new(startup_url),
        })
        .invoke_handler(tauri::generate_handler![
            // Window commands
            commands::window_minimize,
            commands::window_maximize,
            commands::window_close,
            commands::window_fullscreen,
            commands::is_fullscreen,
            // Settings
            commands::get_settings,
            commands::set_settings,
            // Bookmarks
            commands::get_bookmarks,
            commands::set_bookmarks,
            // History
            commands::get_history,
            commands::add_history,
            commands::clear_history,
            commands::set_history,
            // External
            commands::open_external,
            commands::show_save_dialog,
            commands::show_error,
            commands::export_bookmarks,
            commands::import_bookmarks,
            // Tab management
            commands::freeze_tab,
            commands::unfreeze_tab,
            commands::is_tab_frozen,
            // Downloads
            commands::get_downloads,
            commands::start_download,
            commands::cancel_download,
            commands::open_download,
            commands::show_download_in_folder,
            commands::clear_completed_downloads,
            commands::get_downloads_folder,
            // Import
            commands::import_from_browser,
            commands::detect_browsers,
            commands::is_first_launch,
            commands::mark_initialized,
            // Session
            commands::save_session,
            commands::restore_session,
            commands::clear_session,
            // Password manager
            commands::vault_exists,
            commands::is_vault_unlocked,
            commands::create_vault,
            commands::unlock_vault,
            commands::lock_vault,
            commands::get_passwords,
            commands::add_password,
            commands::update_password,
            commands::delete_password,
            commands::search_passwords,
            commands::change_master_password,
            commands::generate_password,
            commands::delete_vault,
            commands::get_remaining_attempts,
            commands::get_passwords_for_url,
            // WebView2 commands - lifecycle
            webview_manager::commands::lifecycle::create_webview,
            webview_manager::commands::lifecycle::close_webview,
            // WebView2 commands - navigation
            webview_manager::commands::navigation::navigate_webview,
            webview_manager::commands::navigation::go_back,
            webview_manager::commands::navigation::go_forward,
            webview_manager::commands::navigation::reload_webview,
            webview_manager::commands::navigation::stop_webview,
            // WebView2 commands - visibility
            webview_manager::commands::visibility::update_webview_bounds,
            webview_manager::commands::visibility::set_webview_visible,
            // WebView2 commands - info
            webview_manager::commands::info::get_webview_info,
            webview_manager::commands::info::get_webview_url,
            webview_manager::commands::info::get_real_page_info,
            webview_manager::commands::info::webview_exists,
            webview_manager::commands::info::debug_webview_info,
            webview_manager::commands::info::get_webview_title,
            // WebView2 commands - misc
            webview_manager::commands::misc::script::execute_script,
            webview_manager::commands::misc::zoom::set_zoom,
            webview_manager::commands::misc::page_info::update_page_info,
            webview_manager::commands::misc::pip::toggle_pip,
            webview_manager::commands::misc::reader_mode::toggle_reader_mode,
            // Ad blocker commands
            adblock::commands::init_adblock,
            adblock::commands::check_url_blocked,
            adblock::commands::set_adblock_enabled,
            adblock::commands::get_adblock_status,
            adblock::commands::get_adblock_stats,
            adblock::commands::reset_adblock_stats,
            adblock::commands::add_custom_filters,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            // Регистрируем горячие клавиши через JavaScript
            setup_keyboard_shortcuts(&window);
            
            // Отправляем startup URL если есть (для "Открыть с помощью")
            let state = app.state::<AppState>();
            if let Some(url) = state.startup_url.lock().unwrap().take() {
                let window_clone = window.clone();
                // Небольшая задержка чтобы фронтенд успел инициализироваться
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = window_clone.emit("open-url", url);
                });
            }
            
            // Инициализируем блокировщик рекламы в фоне
            tauri::async_runtime::spawn(async {
                println!("[AdBlock] Starting filter lists download...");
                match adblock::load_filter_lists().await {
                    Ok(count) => println!("[AdBlock] Initialized with {} rules", count),
                    Err(e) => eprintln!("[AdBlock] Failed to load filter lists: {}", e),
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_keyboard_shortcuts(window: &tauri::WebviewWindow) {
    use tauri::Emitter;
    
    // Отправляем событие для инициализации клавиатурных сокращений на фронтенде
    let _ = window.emit("init-shortcuts", ());
}
