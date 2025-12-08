pub const NOTIFICATION_STYLES_JS: &str = r#"
    <style>
        #axion-reader-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 30, 50, 0.95);
            color: #fff;
            padding: 16px 24px;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
            animation: axion-slide-in 0.3s ease-out;
        }
        @keyframes axion-slide-in {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        #axion-reader-notification svg {
            flex-shrink: 0;
        }
    </style>
"#;

pub const UNSUPPORTED_NOTIFICATION_JS: &str = r##"
    const notification = document.createElement('div');
    notification.id = 'axion-reader-notification';
    notification.innerHTML = `
        ${NOTIFICATION_STYLES}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
        </svg>
        <span>Режим чтения не поддерживается для этого сайта</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
    console.log('Reader Mode: Site not supported -', hostname);
    return { success: false, error: 'unsupported_site', site: hostname };
"##;

pub const NO_CONTENT_NOTIFICATION_JS: &str = r##"
    const notification = document.createElement('div');
    notification.id = 'axion-reader-notification';
    notification.innerHTML = `
        ${NOTIFICATION_STYLES}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6"/>
        </svg>
        <span>Не удалось найти основной контент на странице</span>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
    console.log('Reader Mode: No suitable content found');
    return { success: false, error: 'no_content' };
"##;
