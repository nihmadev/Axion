//! Tauri команды для управления WebView
//!
//! Модуль разделён на подмодули по функциональности:
//! - `lifecycle` - создание и закрытие WebView
//! - `navigation` - навигация (back, forward, reload, stop)
//! - `visibility` - управление видимостью и размерами
//! - `info` - получение информации о WebView
//! - `misc` - прочие команды (zoom, script execution)

// Все подмодули публичные для доступа к __cmd__ функциям Tauri
pub mod lifecycle;
pub mod navigation;
pub mod visibility;
pub mod info;
pub mod misc;
