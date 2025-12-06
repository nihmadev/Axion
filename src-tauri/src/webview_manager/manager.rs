//! WebView Manager — управление состоянием WebView

use std::collections::HashMap;
use super::types::WebViewInfo;

/// Менеджер WebView — хранит информацию о всех активных WebView
pub struct WebViewManager {
    webviews: HashMap<String, WebViewInfo>,
}

impl WebViewManager {
    pub fn new() -> Self {
        Self {
            webviews: HashMap::new(),
        }
    }

    /// Добавить новый WebView
    pub fn add(&mut self, id: String, url: String) {
        self.webviews.insert(id.clone(), WebViewInfo {
            id,
            url,
            title: String::new(),
            favicon: String::new(),
            is_loading: true,
            can_go_back: false,
            can_go_forward: false,
        });
    }

    /// Удалить WebView
    pub fn remove(&mut self, id: &str) {
        self.webviews.remove(id);
    }

    /// Получить информацию о WebView
    pub fn get(&self, id: &str) -> Option<&WebViewInfo> {
        self.webviews.get(id)
    }

    /// Обновить URL
    pub fn update_url(&mut self, id: &str, url: String) {
        if let Some(info) = self.webviews.get_mut(id) {
            info.url = url;
        }
    }

    /// Обновить заголовок
    pub fn update_title(&mut self, id: &str, title: String) {
        if let Some(info) = self.webviews.get_mut(id) {
            info.title = title;
        }
    }

    /// Обновить favicon
    pub fn update_favicon(&mut self, id: &str, favicon: String) {
        if let Some(info) = self.webviews.get_mut(id) {
            info.favicon = favicon;
        }
    }

    /// Получить список ID всех WebView
    pub fn list(&self) -> Vec<String> {
        self.webviews.keys().cloned().collect()
    }
}

impl Default for WebViewManager {
    fn default() -> Self {
        Self::new()
    }
}
