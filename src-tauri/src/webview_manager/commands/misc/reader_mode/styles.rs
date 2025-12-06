/// CSS стили для Reader Mode
pub const READER_MODE_STYLES: &str = r#"
    <style id="axion-reader-styles">
        .axion-reader-mode {
            overflow: hidden !important;
        }
        .axion-reader-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            background: #1a1a2e !important;
            z-index: 2147483647 !important;
            overflow-y: auto !important;
            font-family: Georgia, 'Times New Roman', serif !important;
        }
        .axion-reader-container {
            max-width: 700px !important;
            margin: 0 auto !important;
            padding: 40px 24px 80px !important;
            color: #e0e0e0 !important;
            line-height: 1.8 !important;
            font-size: 18px !important;
        }
        .axion-reader-header {
            margin-bottom: 32px !important;
            padding-bottom: 24px !important;
            border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        }
        .axion-reader-title {
            font-size: 32px !important;
            font-weight: 700 !important;
            color: #fff !important;
            margin: 0 0 16px 0 !important;
            line-height: 1.3 !important;
        }
        .axion-reader-meta {
            font-size: 14px !important;
            color: #888 !important;
        }
        .axion-reader-meta span {
            margin-right: 16px !important;
        }
        .axion-reader-meta a {
            color: #7c3aed !important;
            text-decoration: none !important;
        }
        .axion-reader-meta a:hover {
            text-decoration: underline !important;
        }
        .axion-reader-content {
            color: #d0d0d0 !important;
        }
        .axion-reader-content p {
            margin: 0 0 1.5em 0 !important;
        }
        .axion-reader-content h1,
        .axion-reader-content h2,
        .axion-reader-content h3,
        .axion-reader-content h4 {
            color: #fff !important;
            margin: 1.5em 0 0.5em 0 !important;
        }
        .axion-reader-content img {
            max-width: 100% !important;
            height: auto !important;
            border-radius: 8px !important;
            margin: 1em 0 !important;
        }
        .axion-reader-content a {
            color: #7c3aed !important;
        }
        .axion-reader-content blockquote {
            border-left: 3px solid #7c3aed !important;
            padding-left: 20px !important;
            margin: 1.5em 0 !important;
            color: #aaa !important;
            font-style: italic !important;
        }
        .axion-reader-content pre,
        .axion-reader-content code {
            background: rgba(255,255,255,0.05) !important;
            border-radius: 4px !important;
            padding: 2px 6px !important;
            font-family: 'JetBrains Mono', monospace !important;
            font-size: 14px !important;
        }
        .axion-reader-content pre {
            padding: 16px !important;
            overflow-x: auto !important;
        }
        .axion-reader-content ul,
        .axion-reader-content ol {
            padding-left: 24px !important;
            margin: 1em 0 !important;
        }
        .axion-reader-content li {
            margin: 0.5em 0 !important;
        }
        .axion-reader-close {
            position: fixed !important;
            top: 16px !important;
            right: 16px !important;
            width: 40px !important;
            height: 40px !important;
            border-radius: 50% !important;
            background: rgba(255,255,255,0.1) !important;
            border: none !important;
            color: #fff !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 2147483648 !important;
            transition: background 0.2s !important;
        }
        .axion-reader-close:hover {
            background: rgba(255,255,255,0.2) !important;
        }
    </style>
"#;
