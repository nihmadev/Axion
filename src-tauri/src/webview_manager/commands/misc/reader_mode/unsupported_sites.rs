/// JavaScript для проверки неподдерживаемых сайтов
pub const UNSUPPORTED_SITES_JS: &str = r#"
    // Сайты, где режим чтения не работает или ухудшает UX
    const unsupportedSites = [
        'twitter.com', 'x.com',           // Лента твитов, короткий контент
        'youtube.com', 'youtu.be',        // Видео-платформа
        'facebook.com', 'fb.com',         // Социальная сеть
        'instagram.com',                   // Фото/видео контент
        'discord.com', 'discord.gg',      // Чат-платформа
        'twitch.tv',                       // Стриминг
        'tiktok.com',                      // Короткие видео
        'whatsapp.com',                    // Мессенджер
        'telegram.org', 't.me',           // Мессенджер
        'slack.com',                       // Рабочий чат
        'mail.google.com',                // Почта
        'outlook.com', 'outlook.live.com', // Почта
        'drive.google.com',               // Файловое хранилище
        'docs.google.com',                // Документы
        'sheets.google.com',              // Таблицы
        'github.com',                      // Код-репозитории (сложная структура)
        'gitlab.com',                      // Код-репозитории
        'figma.com',                       // Дизайн-инструмент
        'notion.so',                       // Заметки (уже оптимизированы)
        'trello.com',                      // Канбан-доски
        'spotify.com',                     // Музыка
        'netflix.com',                     // Видео
        'amazon.com',                      // Магазин
        'ebay.com',                        // Магазин
        'aliexpress.com',                  // Магазин
        'maps.google.com',                // Карты
        'translate.google.com'            // Переводчик
    ];
    
    // Проверяем, поддерживается ли сайт
    const isUnsupported = unsupportedSites.some(site => hostname.includes(site.replace('www.', '')));
"#;
