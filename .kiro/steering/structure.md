# Project Structure

## Root Layout

```
XOLO/
├── src/renderer/          # React frontend
├── src-tauri/             # Rust backend
├── public/                # Static assets (icons, wallpapers)
├── dist/                  # Build output (generated)
├── .kiro/                 # Kiro AI assistant configuration
└── node_modules/          # Node dependencies (generated)
```

## Frontend Structure (`src/renderer/`)

```
renderer/
├── components/            # React components (organized by feature)
│   ├── AddressBar/       # URL bar and navigation controls
│   ├── Downloads/        # Download manager UI
│   ├── History/          # Browsing history page
│   ├── Settings/         # Settings page with tabs
│   ├── StartPage/        # New tab start page
│   ├── Tabs/             # Tab bar and tab management
│   ├── TitleBar/         # Window title bar and controls
│   ├── WebView/          # WebView container components
│   ├── WelcomePage/      # First-run welcome screen
│   └── ZenSidebar/       # Main sidebar with workspaces and tabs
├── hooks/                # Custom React hooks
├── i18n/                 # Internationalization (translations)
├── styles/               # CSS files
│   ├── components/       # Component-specific styles
│   ├── themes/           # Theme files (dark/light)
│   └── sidebar/          # Sidebar-specific styles
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── App.tsx               # Main application component
├── main.tsx              # React entry point
└── tauri-api.ts          # Tauri IPC wrapper
```

## Backend Structure (`src-tauri/src/`)

```
src/
├── commands.rs           # Tauri command handlers (window, settings, etc.)
├── downloads.rs          # Download manager logic
├── main.rs               # Application entry point
├── scripts/              # JavaScript injection scripts
│   └── page_observer.js  # Page info observer script
├── storage/              # Data persistence modules
│   ├── bookmarks.rs      # Bookmark storage
│   ├── history.rs        # History storage
│   ├── import.rs         # Browser data import
│   ├── session.rs        # Session management
│   └── settings.rs       # Settings storage
└── webview_manager/      # WebView2 lifecycle management
    ├── commands/         # WebView-specific commands
    │   ├── info.rs       # WebView info queries
    │   ├── lifecycle.rs  # Create/close WebView
    │   ├── navigation.rs # Navigate, back, forward, reload
    │   ├── visibility.rs # Show/hide, bounds updates
    │   └── misc.rs       # Scripts, zoom, PiP
    ├── manager.rs        # WebView instance manager
    ├── polling.rs        # State polling logic
    └── types.rs          # WebView type definitions
```

## Code Organization Patterns

### Frontend
- **Component structure**: Each major feature has its own folder under `components/`
- **Hooks**: Custom hooks in `hooks/` follow `use*` naming convention
- **State management**: Local state + custom hooks (no global state library)
- **Styling**: CSS files mirror component structure in `styles/`
- **Types**: Centralized in `types/index.ts`

### Backend
- **Module organization**: Features separated into modules (`storage/`, `webview_manager/`)
- **Commands**: Tauri commands grouped by functionality
- **State**: Shared state via `AppState` struct with `Mutex` wrappers
- **Error handling**: Result types with proper error propagation

## Key Files

- `src/renderer/App.tsx` - Main React component, orchestrates all hooks and state
- `src-tauri/src/main.rs` - Rust entry point, registers all Tauri commands
- `src-tauri/src/webview_manager/manager.rs` - Core WebView2 management logic
- `src/renderer/types/index.ts` - All TypeScript interfaces and types
- `src-tauri/tauri.conf.json` - Application configuration and metadata
