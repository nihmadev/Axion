## Overview

XOLO (Axion) is a lightweight, high-performance web browser designed for Windows. It leverages Tauri framework with React frontend and Rust backend, utilizing native WebView2 for web content rendering.

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript 5** - Type-safe JavaScript
- **Vite 5** - Build tool and dev server

### Backend
- **Rust (Edition 2021)** - Core application logic
- **Tauri 2.0** - Desktop application framework
- **WebView2** - Native Windows web rendering engine
- **SQLite** - Local data storage (via rusqlite)

### Key Dependencies
- `tauri-plugin-shell` - Shell command execution
- `tauri-plugin-dialog` - Native dialogs
- `webview2-com` - WebView2 COM bindings
- `tokio` - Async runtime
- `reqwest` - HTTP client

## Project Structure

```
XOLO/
├── src/
│   └── renderer/           # Frontend (React)
│       ├── components/     # UI components
│       │   ├── AddressBar/     # URL input and navigation
│       │   ├── Downloads/      # Download manager UI
│       │   ├── History/        # Browsing history
│       │   ├── Settings/       # Application settings
│       │   ├── StartPage/      # New tab page
│       │   ├── Tabs/           # Tab management
│       │   ├── TitleBar/       # Window controls
│       │   ├── WebView/        # WebView container
│       │   └── ZenSidebar/     # Sidebar navigation
│       ├── hooks/          # React hooks
│       ├── i18n/           # Internationalization
│       ├── styles/         # CSS stylesheets
│       ├── types/          # TypeScript definitions
│       ├── utils/          # Utility functions
│       ├── App.tsx         # Main application component
│       └── main.tsx        # Application entry point
│
├── src-tauri/              # Backend (Rust)
│   ├── src/
│   │   ├── commands.rs         # Tauri command handlers
│   │   ├── downloads.rs        # Download management
│   │   ├── main.rs             # Application entry point
│   │   ├── scripts/            # Injected JavaScript
│   │   ├── storage/            # Data persistence
│   │   │   ├── bookmarks.rs    # Bookmark storage
│   │   │   ├── history.rs      # History storage
│   │   │   ├── import.rs       # Browser data import
│   │   │   ├── session.rs      # Session management
│   │   │   └── settings.rs     # Settings storage
│   │   └── webview_manager/    # WebView2 management
│   │       ├── commands/       # WebView commands
│   │       ├── manager.rs      # WebView lifecycle
│   │       ├── polling.rs      # State polling
│   │       └── types.rs        # Type definitions
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
│
├── public/                 # Static assets
├── package.json            # Node.js dependencies
├── vite.config.ts          # Vite configuration
└── tsconfig.json           # TypeScript configuration
```

## Features

- **Workspace Management** - Organize tabs into separate workspaces
- **Tab Management** - Create, close, freeze, and restore tabs
- **Bookmarks** - Save and organize favorite pages
- **History** - Browse and search browsing history
- **Downloads** - Built-in download manager with pause/resume
- **Session Restore** - Automatic session persistence
- **Browser Import** - Import data from other browsers
- **Keyboard Shortcuts** - Full keyboard navigation support
- **Zoom Control** - Per-tab zoom settings
- **Internationalization** - Multi-language support

## Requirements

### Development
- **Node.js** 18.0 or higher
- **Rust** 1.70 or higher
- **Windows 10/11** with WebView2 Runtime
- **Visual Studio Build Tools** (for Rust compilation)

### Runtime
- **Windows 10** version 1803 or higher
- **WebView2 Runtime** (bundled with Windows 11, downloadable for Windows 10)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/zxctehas1337/XOLO.git
cd XOLO
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Rust (if not already installed):
```bash
# Visit https://rustup.rs/ and follow instructions
rustup default stable
```

## Development

Start the development server with hot-reload:

```bash
npm run dev
```

This command starts both the Vite dev server and the Tauri application in development mode.

To run only the frontend dev server:

```bash
npm run dev:renderer
```

## Building

### Production Build

Build the complete application:

```bash
npm run build
```

This creates an optimized production build with all installers.

### Specific Installer Formats

Build MSI installer only:
```bash
npm run build:msi
```

Build NSIS installer only:
```bash
npm run build:nsis
```

Build EXE installer:
```bash
npm run build:exe
```

Build all installer formats:
```bash
npm run build:all
```

### Build Output

Built artifacts are located in:
```
src-tauri/target/release/bundle/
├── msi/        # MSI installer
└── nsis/       # NSIS installer (EXE)
```

## Configuration

### Tauri Configuration
Edit `src-tauri/tauri.conf.json` to modify:
- Application name and version
- Window properties
- Security settings
- Bundle configuration

### Vite Configuration
Edit `vite.config.ts` to modify:
- Build optimization
- Plugin configuration
- Development server settings

## Architecture

### Frontend-Backend Communication
The application uses Tauri's IPC (Inter-Process Communication) system:
- Frontend invokes Rust commands via `@tauri-apps/api`
- Backend emits events to frontend for async updates
- WebView state is synchronized through polling and event emission

### WebView Management
Native WebView2 instances are managed by the Rust backend:
- Each tab corresponds to a separate WebView2 instance
- Visibility and bounds are controlled programmatically
- Navigation events are captured and forwarded to the frontend

### Data Persistence
Application data is stored in the user's app data directory:
- Settings, bookmarks, and history use JSON files
- Session data enables tab restoration on restart

## License

GPLv3

## Version

Current version: 1.7.9
