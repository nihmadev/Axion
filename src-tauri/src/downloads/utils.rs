use std::path::PathBuf;

pub fn get_downloads_dir() -> Result<PathBuf, String> {
    dirs::download_dir()
        .ok_or_else(|| "Could not find downloads directory".to_string())
}

pub fn get_downloads_file() -> Result<PathBuf, String> {
    let data_dir = dirs::data_dir()
        .ok_or_else(|| "Could not find data directory".to_string())?
        .join("axion-browser");
    
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    
    Ok(data_dir.join("downloads.json"))
}

pub fn extract_filename(url: &str, content_disposition: Option<&str>) -> String {
    if let Some(cd) = content_disposition {
        if let Some(start) = cd.find("filename=") {
            let rest = &cd[start + 9..];
            let filename = if rest.starts_with('"') {
                rest[1..].split('"').next().unwrap_or("download")
            } else {
                rest.split(';').next().unwrap_or("download").trim()
            };
            if !filename.is_empty() {
                return filename.to_string();
            }
        }
    }
    
    if let Ok(parsed) = url::Url::parse(url) {
        if let Some(segments) = parsed.path_segments() {
            if let Some(last) = segments.last() {
                let decoded = urlencoding::decode(last).unwrap_or_else(|_| last.into());
                if !decoded.is_empty() && decoded != "/" {
                    return decoded.to_string();
                }
            }
        }
    }
    
    format!("download_{}", chrono::Utc::now().timestamp())
}

pub fn get_unique_filename(dir: &PathBuf, filename: &str) -> String {
    let path = dir.join(filename);
    if !path.exists() {
        return filename.to_string();
    }
    
    let stem = std::path::Path::new(filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(filename);
    let ext = std::path::Path::new(filename)
        .extension()
        .and_then(|s| s.to_str())
        .map(|e| format!(".{}", e))
        .unwrap_or_default();
    
    for i in 1..1000 {
        let new_name = format!("{} ({}){}", stem, i, ext);
        if !dir.join(&new_name).exists() {
            return new_name;
        }
    }
    
    format!("{}_{}{}", stem, chrono::Utc::now().timestamp(), ext)
}
