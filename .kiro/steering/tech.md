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
- **WebView2 COM bindings** (`webview2-com` 0.31) for native WebView2 control
- **Tokio** async runtime
- **SQLite** via `rusqlite` for data storage
- **Serde** for JSON serialization
- **adblock** crate for ad/tracker blocking

## Key Dependencies

Frontend:
- `@tauri-apps/api` ^2.0.0 - Tauri IPC bindings
- `@tauri-apps/plugin-shell` ^2.3.3 - Shell plugin
- `react`, `react-dom` ^18.2.0 - UI framework
- `uuid` ^9.0.0 - ID generation
- `simple-icons` ^16.0.0 - Icon library

Backend:
- `tauri` 2.0 with `devtools` and `unstable` features
- `tauri-plugin-shell`, `tauri-plugin-dialog`, `tauri-plugin-opener` - Tauri plugins
- `reqwest` 0.11 - HTTP client with streaming support
- `chrono` 0.4 - Date/time handling
- `windows` 0.58 - Windows API bindings (DWM, COM, WindowsAndMessaging)
- `webview2-com` 0.31 - WebView2 COM bindings
- `rusqlite` 0.31 - SQLite database
- `adblock` 0.8 - Ad blocking engine
- `aes-gcm` 0.10 - AES-GCM encryption for password vault
- `argon2` 0.5 - Key derivation for password vault
- `base64` 0.22 - Base64 encoding
- `once_cell` 1.19 - Lazy static initialization

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
npm run build:exe        # Alias for NSIS build
npm run build:all        # Build all installer formats (MSI + NSIS)
```

Build output: `src-tauri/target/release/bundle/`

### Configuration Files

- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `src-tauri/tauri.conf.json` - Tauri app configuration
- `src-tauri/Cargo.toml` - Rust dependencies

### Release Profile

Optimized for size:
- `panic = "abort"` - No unwinding
- `codegen-units = 1` - Single codegen unit
- `lto = true` - Link-time optimization
- `opt-level = "z"` - Optimize for size

## Development Requirements

- Node.js 18+
- Rust 1.70+
- Visual Studio Build Tools (for Rust Windows compilation)
- WebView2 Runtime (bundled with Windows 11)
