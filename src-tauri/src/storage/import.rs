use serde::Serialize;

use super::{Bookmark, HistoryEntry};

#[derive(Serialize)]
pub struct ImportResult {
    pub bookmarks: Vec<Bookmark>,
    pub history: Vec<HistoryEntry>,
}

#[derive(Serialize, Clone)]
pub struct DetectedBrowser {
    pub id: String,
    pub name: String,
    pub available: bool,
}

/// Detects which browsers are installed on the system
pub async fn detect_browsers() -> Result<Vec<DetectedBrowser>, String> {
    let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    
    let mut browsers = Vec::new();
    
    // Chrome detection
    #[cfg(target_os = "windows")]
    let chrome_path = home_dir.join("AppData/Local/Google/Chrome/User Data/Default");
    #[cfg(target_os = "macos")]
    let chrome_path = home_dir.join("Library/Application Support/Google/Chrome/Default");
    #[cfg(target_os = "linux")]
    let chrome_path = home_dir.join(".config/google-chrome/Default");
    
    browsers.push(DetectedBrowser {
        id: "chrome".to_string(),
        name: "Google Chrome".to_string(),
        available: chrome_path.exists(),
    });
    
    // Edge detection
    #[cfg(target_os = "windows")]
    let edge_path = home_dir.join("AppData/Local/Microsoft/Edge/User Data/Default");
    #[cfg(target_os = "macos")]
    let edge_path = home_dir.join("Library/Application Support/Microsoft Edge/Default");
    #[cfg(target_os = "linux")]
    let edge_path = home_dir.join(".config/microsoft-edge/Default");
    
    browsers.push(DetectedBrowser {
        id: "edge".to_string(),
        name: "Microsoft Edge".to_string(),
        available: edge_path.exists(),
    });
    
    // Firefox detection
    #[cfg(target_os = "windows")]
    let firefox_path = home_dir.join("AppData/Local/Mozilla/Firefox/Profiles");
    #[cfg(target_os = "macos")]
    let firefox_path = home_dir.join("Library/Application Support/Firefox/Profiles");
    #[cfg(target_os = "linux")]
    let firefox_path = home_dir.join(".mozilla/firefox");
    
    let firefox_available = if firefox_path.exists() {
        // Check if there's at least one profile with places.sqlite
        if let Ok(mut entries) = tokio::fs::read_dir(&firefox_path).await {
            let mut found = false;
            while let Ok(Some(entry)) = entries.next_entry().await {
                let path = entry.path();
                if path.is_dir() && path.join("places.sqlite").exists() {
                    found = true;
                    break;
                }
            }
            found
        } else {
            false
        }
    } else {
        false
    };
    
    browsers.push(DetectedBrowser {
        id: "firefox".to_string(),
        name: "Mozilla Firefox".to_string(),
        available: firefox_available,
    });
    
    // Zen Browser detection
    #[cfg(target_os = "windows")]
    let zen_path = home_dir.join("AppData/Local/Zen Browser/Profiles");
    #[cfg(target_os = "macos")]
    let zen_path = home_dir.join("Library/Application Support/Zen Browser/Profiles");
    #[cfg(target_os = "linux")]
    let zen_path = home_dir.join(".config/zen-browser");
    
    let zen_available = if zen_path.exists() {
        if let Ok(mut entries) = tokio::fs::read_dir(&zen_path).await {
            let mut found = false;
            while let Ok(Some(entry)) = entries.next_entry().await {
                let path = entry.path();
                if path.is_dir() && path.join("places.sqlite").exists() {
                    found = true;
                    break;
                }
            }
            found
        } else {
            false
        }
    } else {
        false
    };
    
    browsers.push(DetectedBrowser {
        id: "zen".to_string(),
        name: "Zen Browser".to_string(),
        available: zen_available,
    });
    
    Ok(browsers)
}

pub async fn import_from_browser(browser: &str) -> Result<Option<ImportResult>, String> {
    match browser {
        "chrome" | "edge" => import_chrome_based_browser(browser).await,
        "firefox" => import_firefox_browser().await,
        "zen" => import_zen_browser().await,
        _ => Ok(None),
    }
}

async fn import_chrome_based_browser(browser: &str) -> Result<Option<ImportResult>, String> {
    let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;

    let (bookmarks_path, history_path) = match browser {
        "chrome" => {
            #[cfg(target_os = "windows")]
            {
                (
                    home_dir.join("AppData/Local/Google/Chrome/User Data/Default/Bookmarks"),
                    home_dir.join("AppData/Local/Google/Chrome/User Data/Default/History"),
                )
            }

            #[cfg(target_os = "macos")]
            {
                (
                    home_dir.join("Library/Application Support/Google/Chrome/Default/Bookmarks"),
                    home_dir.join("Library/Application Support/Google/Chrome/Default/History"),
                )
            }

            #[cfg(target_os = "linux")]
            {
                (
                    home_dir.join(".config/google-chrome/Default/Bookmarks"),
                    home_dir.join(".config/google-chrome/Default/History"),
                )
            }
        }
        "edge" => {
            #[cfg(target_os = "windows")]
            {
                (
                    home_dir.join("AppData/Local/Microsoft/Edge/User Data/Default/Bookmarks"),
                    home_dir.join("AppData/Local/Microsoft/Edge/User Data/Default/History"),
                )
            }

            #[cfg(target_os = "macos")]
            {
                (
                    home_dir.join("Library/Application Support/Microsoft Edge/Default/Bookmarks"),
                    home_dir.join("Library/Application Support/Microsoft Edge/Default/History"),
                )
            }

            #[cfg(target_os = "linux")]
            {
                (
                    home_dir.join(".config/microsoft-edge/Default/Bookmarks"),
                    home_dir.join(".config/microsoft-edge/Default/History"),
                )
            }
        }
        _ => return Ok(None),
    };

    let mut bookmarks = Vec::new();

    // Импорт закладок
    if bookmarks_path.exists() {
        let content = tokio::fs::read_to_string(&bookmarks_path)
            .await
            .map_err(|e| e.to_string())?;

        let data: serde_json::Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;

        fn extract_bookmarks(node: &serde_json::Value, bookmarks: &mut Vec<Bookmark>) {
            if let Some(node_type) = node.get("type").and_then(|v| v.as_str()) {
                if node_type == "url" {
                    if let (Some(url), Some(name)) = (
                        node.get("url").and_then(|v| v.as_str()),
                        node.get("name").and_then(|v| v.as_str()),
                    ) {
                        bookmarks.push(Bookmark {
                            id: format!(
                                "{}{}",
                                chrono::Utc::now().timestamp_millis(),
                                rand::random::<u32>()
                            ),
                            url: url.to_string(),
                            title: name.to_string(),
                            favicon: None,
                            created_at: chrono::Utc::now().timestamp_millis(),
                        });
                    }
                }
            }

            if let Some(children) = node.get("children").and_then(|v| v.as_array()) {
                for child in children {
                    extract_bookmarks(child, bookmarks);
                }
            }
        }

        if let Some(roots) = data.get("roots").and_then(|v| v.as_object()) {
            for (_, root) in roots {
                extract_bookmarks(root, &mut bookmarks);
            }
        }
    }

    // Импорт истории
    let mut history = Vec::new();
    if history_path.exists() {
        history = import_chrome_history(&history_path).await?;
    }

    Ok(Some(ImportResult {
        bookmarks,
        history,
    }))
}

async fn import_chrome_history(history_path: &std::path::Path) -> Result<Vec<HistoryEntry>, String> {
    // Chrome хранит историю в SQLite базе данных
    let temp_path = history_path.with_extension("temp");

    // Копируем файл, так как Chrome может держать его заблокированным
    tokio::fs::copy(history_path, &temp_path)
        .await
        .map_err(|e| e.to_string())?;

    let temp_path_clone = temp_path.clone();
    let history = tokio::task::spawn_blocking(move || {
        let conn = rusqlite::Connection::open(&temp_path_clone).map_err(|e| e.to_string())?;

        let mut stmt = conn
            .prepare(
                "
            SELECT url, title, last_visit_time 
            FROM urls 
            ORDER BY last_visit_time DESC 
            LIMIT 1000
        ",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                let url: String = row.get(0)?;
                let title: String = row.get(1)?;
                let last_visit_time: i64 = row.get(2)?;

                Ok(HistoryEntry {
                    id: format!(
                        "{}{}",
                        chrono::Utc::now().timestamp_millis(),
                        rand::random::<u32>()
                    ),
                    url,
                    title,
                    favicon: None,
                    visited_at: chrome_time_to_timestamp(last_visit_time),
                })
            })
            .map_err(|e| e.to_string())?;

        let mut history = Vec::new();
        for row in rows {
            history.push(row.map_err(|e| e.to_string())?);
        }

        Ok::<Vec<HistoryEntry>, String>(history)
    })
    .await
    .map_err(|e| e.to_string())??;

    // Удаляем временный файл
    let _ = tokio::fs::remove_file(&temp_path).await;

    Ok(history)
}

fn chrome_time_to_timestamp(chrome_time: i64) -> i64 {
    // Chrome использует время с 1601-01-01 в микросекундах
    const WEBKIT_TIMESTAMP_TO_UNIX_EPOCH: i64 = 11644473600000000;
    (chrome_time - WEBKIT_TIMESTAMP_TO_UNIX_EPOCH) / 1000000
}

async fn import_firefox_browser() -> Result<Option<ImportResult>, String> {
    let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;

    let firefox_profile = find_firefox_profile(&home_dir).await?;
    if firefox_profile.is_none() {
        return Ok(None);
    }

    let profile_path = firefox_profile.unwrap();
    let bookmarks_path = profile_path.join("places.sqlite");

    if !bookmarks_path.exists() {
        return Ok(None);
    }

    let (bookmarks, history) = import_firefox_data(&bookmarks_path).await?;

    Ok(Some(ImportResult {
        bookmarks,
        history,
    }))
}

async fn import_zen_browser() -> Result<Option<ImportResult>, String> {
    // Zen основан на Firefox, используем ту же логику
    let home_dir = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;

    #[cfg(target_os = "windows")]
    let zen_profile_path = home_dir.join("AppData/Local/Zen Browser/Profiles");

    #[cfg(target_os = "macos")]
    let zen_profile_path = home_dir.join("Library/Application Support/Zen Browser/Profiles");

    #[cfg(target_os = "linux")]
    let zen_profile_path = home_dir.join(".config/zen-browser");

    if !zen_profile_path.exists() {
        return Ok(None);
    }

    let places_path = find_zen_places_file(&zen_profile_path).await?;
    if places_path.is_none() {
        return Ok(None);
    }

    let (bookmarks, history) = import_firefox_data(&places_path.unwrap()).await?;

    Ok(Some(ImportResult {
        bookmarks,
        history,
    }))
}

async fn find_firefox_profile(
    home_dir: &std::path::Path,
) -> Result<Option<std::path::PathBuf>, String> {
    #[cfg(target_os = "windows")]
    let firefox_dir = home_dir.join("AppData/Local/Mozilla/Firefox/Profiles");

    #[cfg(target_os = "macos")]
    let firefox_dir = home_dir.join("Library/Application Support/Firefox/Profiles");

    #[cfg(target_os = "linux")]
    let firefox_dir = home_dir.join(".mozilla/firefox");

    if !firefox_dir.exists() {
        return Ok(None);
    }

    let mut entries = tokio::fs::read_dir(firefox_dir)
        .await
        .map_err(|e| e.to_string())?;

    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
        let path = entry.path();
        if path.is_dir() && path.join("places.sqlite").exists() {
            return Ok(Some(path));
        }
    }

    Ok(None)
}

async fn find_zen_places_file(
    zen_dir: &std::path::Path,
) -> Result<Option<std::path::PathBuf>, String> {
    let mut entries = tokio::fs::read_dir(zen_dir)
        .await
        .map_err(|e| e.to_string())?;

    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
        let path = entry.path();
        if path.is_dir() && path.join("places.sqlite").exists() {
            return Ok(Some(path.join("places.sqlite")));
        }
    }

    Ok(None)
}

async fn import_firefox_data(
    places_path: &std::path::Path,
) -> Result<(Vec<Bookmark>, Vec<HistoryEntry>), String> {
    let temp_path = places_path.with_extension("temp");

    // Копируем файл, так как Firefox может держать его заблокированным
    tokio::fs::copy(places_path, &temp_path)
        .await
        .map_err(|e| e.to_string())?;

    let temp_path_clone = temp_path.clone();
    let result = tokio::task::spawn_blocking(move || {
        let conn = rusqlite::Connection::open(&temp_path_clone).map_err(|e| e.to_string())?;

        // Импорт закладок
        let mut bookmarks = Vec::new();
        let mut stmt = conn
            .prepare(
                "
            SELECT b.title, p.url 
            FROM moz_bookmarks b
            JOIN moz_places p ON b.fk = p.id
            WHERE b.type = 1 AND p.url IS NOT NULL
            LIMIT 1000
        ",
            )
            .map_err(|e| e.to_string())?;

        let bookmark_rows = stmt
            .query_map([], |row| {
                let title: String = row.get(0).unwrap_or_else(|_| "Untitled".to_string());
                let url: String = row.get(1)?;

                Ok(Bookmark {
                    id: format!(
                        "{}{}",
                        chrono::Utc::now().timestamp_millis(),
                        rand::random::<u32>()
                    ),
                    url,
                    title,
                    favicon: None,
                    created_at: chrono::Utc::now().timestamp_millis(),
                })
            })
            .map_err(|e| e.to_string())?;

        for row in bookmark_rows {
            bookmarks.push(row.map_err(|e| e.to_string())?);
        }

        // Импорт истории
        let mut history = Vec::new();
        let mut stmt = conn
            .prepare(
                "
            SELECT url, title, last_visit_date 
            FROM moz_places 
            WHERE url IS NOT NULL AND last_visit_date IS NOT NULL
            ORDER BY last_visit_date DESC 
            LIMIT 1000
        ",
            )
            .map_err(|e| e.to_string())?;

        let history_rows = stmt
            .query_map([], |row| {
                let url: String = row.get(0)?;
                let title: String = row.get(1).unwrap_or_else(|_| "Untitled".to_string());
                let last_visit_date: i64 = row.get(2)?;

                Ok(HistoryEntry {
                    id: format!(
                        "{}{}",
                        chrono::Utc::now().timestamp_millis(),
                        rand::random::<u32>()
                    ),
                    url,
                    title,
                    favicon: None,
                    visited_at: firefox_time_to_timestamp(last_visit_date),
                })
            })
            .map_err(|e| e.to_string())?;

        for row in history_rows {
            history.push(row.map_err(|e| e.to_string())?);
        }

        Ok::<(Vec<Bookmark>, Vec<HistoryEntry>), String>((bookmarks, history))
    })
    .await
    .map_err(|e| e.to_string())??;

    // Удаляем временный файл
    let _ = tokio::fs::remove_file(&temp_path).await;

    Ok(result)
}

fn firefox_time_to_timestamp(firefox_time: i64) -> i64 {
    // Firefox использует время с 1970-01-01 в микросекундах
    firefox_time / 1000000
}
