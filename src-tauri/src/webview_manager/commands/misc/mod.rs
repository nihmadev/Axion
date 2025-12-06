//! Прочие команды WebView (zoom, script execution, page info update, PiP, Reader Mode)
//!
//! Подмодули:
//! - `pip` - Picture-in-Picture режим
//! - `reader_mode` - режим чтения
//! - `zoom` - управление масштабом
//! - `script` - выполнение JavaScript
//! - `page_info` - обновление информации о странице

pub mod pip;
pub mod reader_mode;
pub mod zoom;
pub mod script;
pub mod page_info;
