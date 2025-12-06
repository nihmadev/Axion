# Technology Stack

## Frontend

- **React 18** with TypeScript 5
- **Vite 5** for build tooling and dev server
- **CSS Modules** and vanilla CSS for styling
- Custom hooks pattern for state management (no Redux/Zustand)
- Path alias: `@/*` maps to `src/*`

## Backend

- **Rust** (Edition 2021)
- **Tauri 2.0** desktop framework
- **WebView2 COM bindings** (`webview2-com`) for native WebView2 control
- **Tokio** async runtime
- **SQLite** via `rusqlite` for data storage
- **Serde** for JSON serialization

## Key Dependencies

Frontend:
- `@tauri-apps/api` - Tauri IPC bindings
- `react`, `react-dom` - UI framework
- `uuid` - ID generation
- `simple-icons` - Icon library

Backend:
- `tauri-plugin-shell`, `tauri-plugin-dialog`, `tauri-plugin-opener` - Tauri plugins
- `reqwest` - HTTP client
- `chrono` - Date/time handling
- `windows` crate - Windows API bindings

## Build System

### Development
```bash
npm run dev              # Start Tauri dev mode (frontend + backend)
npm run dev:renderer     # Start Vite dev server only
```

### Production Build
```bash
npm run build            # Build complete application
npm run build:renderer   # Build frontend only
npm run build:msi        # Build MSI installer
npm run build:nsis       # Build NSIS (EXE) installer
npm run build:all        # Build all installer formats
```

Build output: `src-tauri/target/release/bundle/`

### Configuration Files

- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `src-tauri/tauri.conf.json` - Tauri app configuration
- `src-tauri/Cargo.toml` - Rust dependencies

## Development Requirements

- Node.js 18+
- Rust 1.70+
- Visual Studio Build Tools (for Rust Windows compilation)
- WebView2 Runtime (bundled with Windows 11)
