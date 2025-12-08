use crate::webview_manager::CHROME_USER_AGENT;

pub fn get_filename_from_headers(url: &str) -> Option<String> {
    let client = reqwest::blocking::Client::builder()
        .user_agent(CHROME_USER_AGENT)
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .ok()?;
    
    let response = client.head(url).send().ok()?;
    let headers = response.headers();
    
    if let Some(cd) = headers.get("content-disposition") {
        if let Ok(cd_str) = cd.to_str() {
            if let Some(start) = cd_str.find("filename*=") {
                let rest = &cd_str[start + 10..];
                let encoded = if let Some(pos) = rest.find("''") {
                    &rest[pos + 2..]
                } else {
                    rest
                };
                let end = encoded.find(';').unwrap_or(encoded.len());
                let encoded_name = encoded[..end].trim().trim_matches('"');
                if let Ok(decoded) = urlencoding::decode(encoded_name) {
                    if !decoded.is_empty() {
                        return Some(decoded.to_string());
                    }
                }
            }
            
            if let Some(start) = cd_str.find("filename=") {
                let rest = &cd_str[start + 9..];
                let filename = if rest.starts_with('"') {
                    rest[1..].split('"').next().unwrap_or("")
                } else {
                    rest.split(';').next().unwrap_or("").trim()
                };
                if !filename.is_empty() {
                    let decoded = urlencoding::decode(filename).unwrap_or_else(|_| filename.into());
                    return Some(decoded.to_string());
                }
            }
        }
    }
    
    None
}
