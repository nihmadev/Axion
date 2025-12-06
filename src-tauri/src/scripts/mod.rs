//! JavaScript скрипты для инжекции в WebView

/// Скрипт для отслеживания изменений страницы (URL, title, favicon)
/// Отправляет данные в Rust через title-based IPC механизм
pub const PAGE_OBSERVER_SCRIPT: &str = include_str!("page_observer.js");
