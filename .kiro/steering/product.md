# Product Overview

XOLO (Axion) is a lightweight, high-performance web browser for Windows that emphasizes workspace organization and customization.

## Core Features

- **Workspace Management**: Organize tabs into separate workspaces with custom icons and colors
- **Tab Management**: Create, freeze, restore, and organize tabs with thumbnails and previews
- **Native WebView2**: Uses Windows native WebView2 for web rendering (not Chromium embedded)
- **Session Persistence**: Automatic session save/restore across restarts
- **Downloads Manager**: Built-in download manager with pause/resume capabilities
- **Browser Import**: Import bookmarks and history from Chrome, Firefox, Edge, and Zen
- **Multi-language**: Supports English, Russian, Spanish, French, and German
- **Customization**: Themes, accent colors, fonts, sidebar positioning, and wallpapers

## Target Platform

Windows 10 (version 1803+) and Windows 11 only. Requires WebView2 Runtime.

## Architecture

Desktop application built with Tauri 2.0 framework:
- React frontend for UI
- Rust backend for system integration and WebView2 management
- IPC communication between frontend and backend
- Local JSON-based storage for settings, bookmarks, and history
