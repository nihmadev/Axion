# Product Overview

Axion is a lightweight, high-performance web browser for Windows that emphasizes workspace organization and customization.

**Current Version**: 1.7.9

## Core Features

- **Workspace Management**: Organize tabs into separate workspaces with custom icons and colors
- **Tab Management**: Create, freeze, restore, and organize tabs with thumbnails and previews
- **Tab Groups**: Group tabs within workspaces with custom colors and collapsible sections
- **Split View**: View two tabs side-by-side with adjustable split ratio
- **Native WebView2**: Uses Windows native WebView2 for web rendering (not Chromium embedded)
- **Session Persistence**: Automatic session save/restore across restarts
- **Downloads Manager**: Built-in download manager with pause/resume capabilities
- **Browser Import**: Import bookmarks and history from Chrome, Firefox, Edge, and Zen
- **Multi-language**: Supports English, Russian, Spanish, French, German, and Chinese (Simplified)
- **Customization**: Themes, accent colors, fonts, sidebar positioning, and wallpapers

## Privacy & Security Features

- **Ad Blocking**: Built-in ad blocker using `adblock` crate
- **Tracking Protection**: Block known trackers
- **HTTPS-Only Mode**: Force HTTPS connections
- **DNS-over-HTTPS**: Support for Cloudflare, Google, Quad9, AdGuard, or custom DoH providers
- **Password Vault**: Encrypted password storage with AES-GCM and Argon2 key derivation
- **Password Autofill**: Automatic form filling with saved credentials
- **Clear Data on Exit**: Optional automatic data clearing

## Performance Features

- **Tab Freezing**: Automatically suspend inactive tabs to save memory
- **Tab Suspension Timeout**: Configurable timeout for tab suspension
- **Hardware Acceleration**: WebView2 GPU acceleration
- **Page Preloading**: Optional preloading of linked pages

## UI Components

- **Zen Sidebar**: Main navigation with workspaces, tabs, and quick sites
- **Start Page**: Customizable new tab page with clock, weather, quotes, todos
- **Quick Sites**: Pinned sites grid with multiple layout options
- **Notifications**: Toast notification system
- **Update Banner**: In-app update notifications
- **Autofill Popup**: Password autofill suggestions UI
- **Reader Mode**: Distraction-free reading view

## Target Platform

Windows 10 (version 1803+) and Windows 11 only. Requires WebView2 Runtime.

## Architecture

Desktop application built with Tauri 2.0 framework:
- React frontend for UI
- Rust backend for system integration and WebView2 management
- IPC communication between frontend and backend
- SQLite database for history storage
- JSON-based storage for settings, bookmarks, and session data
- Encrypted vault for password storage
