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
│   ├── Autofill/         # Password autofill popup and save prompt
│   ├── Downloads/        # Download manager UI
│   ├── History/          # Browsing history page
│   ├── Import/           # Browser data import wizard
│   ├── Notifications/    # Toast notifications system
│   ├── QuickSites/       # Quick access sites grid
│   ├── Settings/         # Settings page with tabs
│   ├── StartPage/        # New tab start page
│   ├── Tabs/             # Tab bar and tab management
│   ├── TitleBar/         # Window title bar and controls
│   ├── WebView/          # WebView container components
│   ├── WelcomePage/      # First-run welcome screen
│   ├── ZenSidebar/       # Main sidebar with workspaces and tabs
│   ├── AppModals.tsx     # Global modals container
│   └── UpdateBanner.tsx  # App update notification banner
├── hooks/                # Custom React hooks
│   ├── useAppHandlers.ts # App-level event handlers
│   ├── useAppState.ts    # Global app state management
│   ├── useAutofill.ts    # Password autofill management
│   ├── useBookmarks.ts   # Bookmarks CRUD operations
│   ├── useHistory.ts     # Browsing history management
│   ├── useNavigation.ts  # WebView navigation controls
│   ├── useSession.ts     # Session save/restore
│   ├── useShortcuts.ts   # Keyboard shortcuts handler
│   ├── useStartPageData.ts # Start page widgets data
│   ├── useTabMemory.ts   # Tab freezing/memory management
│   ├── useTabThumbnails.ts # Tab preview screenshots
│   ├── useTranslation.ts # i18n hook
│   ├── useWallpaper.ts   # Wallpaper management
│   ├── useWebViewVisibility.ts # WebView show/hide logic
│   ├── useWorkspaces.ts  # Workspace management
│   └── useZoom.ts        # Page zoom controls
├── i18n/                 # Internationalization
│   ├── en.ts, ru.ts, es.ts, fr.ts, de.ts, zh-CN.ts
│   ├── types.ts          # Translation key types
│   └── index.ts          # i18n exports
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
├── main.rs               # Application entry point
├── adblock/              # Ad blocking module
│   ├── mod.rs            # Module exports
│   └── commands.rs       # Adblock Tauri commands
├── downloads/            # Download manager module
│   ├── mod.rs            # Module exports
│   ├── downloader.rs     # Download execution logic
│   ├── storage.rs        # Download history persistence
│   ├── types.rs          # Download types
│   └── utils.rs          # Download utilities
├── scripts/              # JavaScript injection scripts
│   ├── mod.rs            # Module exports
│   ├── autofill.js       # Password autofill injection script
│   └── page_observer.js  # Page info observer script
├── storage/              # Data persistence modules
│   ├── mod.rs            # Module exports
│   ├── bookmarks.rs      # Bookmark storage
│   ├── history.rs        # History storage (SQLite)
│   ├── import.rs         # Browser data import
│   ├── session.rs        # Session management
│   ├── settings.rs       # Settings storage
│   └── passwords/        # Password manager module
│       ├── mod.rs        # Module exports
│       ├── crypto.rs     # AES-GCM encryption
│       ├── operations.rs # CRUD operations
│       ├── types.rs      # Password types
│       └── vault.rs      # Encrypted vault storage
└── webview_manager/      # WebView2 lifecycle management
    ├── mod.rs            # Module exports
    ├── manager.rs        # WebView instance manager
    ├── polling.rs        # State polling logic
    ├── types.rs          # WebView type definitions
    └── commands/         # WebView-specific commands
        ├── mod.rs        # Commands exports
        ├── info.rs       # WebView info queries
        ├── navigation.rs # Navigate, back, forward, reload
        ├── visibility.rs # Show/hide, bounds updates
        ├── lifecycle/    # WebView lifecycle commands
        │   ├── mod.rs    # Lifecycle exports
        │   ├── create.rs # Create WebView instance
        │   ├── close.rs  # Close WebView instance
        │   ├── download_handler.rs # Download event handling
        │   └── utils.rs  # Lifecycle utilities
        └── misc/         # Additional commands
            ├── mod.rs    # Misc exports
            ├── page_info.rs # Page information extraction
            ├── pip.rs    # Picture-in-Picture mode
            ├── script.rs # Script injection
            ├── zoom.rs   # Zoom controls
            └── reader_mode/ # Reader mode feature
```

## Code Organization Patterns

### Frontend
- **Component structure**: Each major feature has its own folder under `components/`
- **Hooks**: Custom hooks in `hooks/` follow `use*` naming convention
- **State management**: Local state + custom hooks (no global state library)
- **Styling**: CSS files mirror component structure in `styles/`
- **Types**: Centralized in `types/index.ts`

### Backend
- **Module organization**: Features separated into modules (`storage/`, `webview_manager/`, `downloads/`, `adblock/`)
- **Commands**: Tauri commands grouped by functionality in submodules
- **State**: Shared state via `AppState` struct with `Mutex` wrappers
- **Error handling**: Result types with proper error propagation
- **Security**: Password vault uses AES-GCM encryption with Argon2 key derivation

## Key Files

- `src/renderer/App.tsx` - Main React component, orchestrates all hooks and state
- `src-tauri/src/main.rs` - Rust entry point, registers all Tauri commands
- `src-tauri/src/webview_manager/manager.rs` - Core WebView2 management logic
- `src/renderer/types/index.ts` - All TypeScript interfaces and types
- `src-tauri/tauri.conf.json` - Application configuration and metadata
