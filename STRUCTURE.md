# Axion - Project Structure

```
Axion/
├── .kiro/
│   └── steering/
│       ├── product.md
│       ├── structure.md
│       └── tech.md
├── .vscode/
│   └── settings.json
├── public/
│   ├── duckduckgo.svg
│   ├── firefox.svg
│   ├── google-chrome.svg
│   ├── icon.ico
│   ├── microsoft-edge.svg
│   ├── opera.svg
│   ├── safari.svg
│   ├── vivaldi.svg
│   ├── yandex.svg
│   ├── wallpaper-1.jpg
│   ├── wallpaper-2.jpg
│   ├── wallpaper-3.jpg
│   ├── wallpaper-4.jpg
│   ├── wallpaper-5.jpg
│   ├── wallpaper-6.jpg
│   ├── wallpaper-7.jpg
│   └── wallpaper-8.jpg
├── src/
│   └── renderer/
│       ├── components/
│       │   ├── AddressBar/
│       │   │   └── index.tsx
│       │   ├── Autofill/
│       │   │   ├── AutofillPopup.tsx
│       │   │   ├── SavePasswordPrompt.tsx
│       │   │   └── Autofill.css
│       │   ├── Downloads/
│       │   │   └── index.tsx
│       │   ├── History/
│       │   │   └── index.tsx
│       │   ├── Import/
│       │   │   └── index.tsx
│       │   ├── Notifications/
│       │   │   └── index.tsx
│       │   ├── QuickSites/
│       │   │   └── index.tsx
│       │   ├── Settings/
│       │   │   ├── tabs/
│       │   │   │   ├── AboutTab.tsx
│       │   │   │   ├── AppearanceTab.tsx
│       │   │   │   ├── GeneralTab.tsx
│       │   │   │   ├── PasswordsTab.tsx
│       │   │   │   ├── PrivacyTab.tsx
│       │   │   │   └── SearchTab.tsx
│       │   │   └── index.tsx
│       │   ├── StartPage/
│       │   │   ├── components/
│       │   │   │   ├── ClockWidget.tsx
│       │   │   │   ├── QuickSites.tsx
│       │   │   │   ├── SearchBox.tsx
│       │   │   │   └── WeatherWidget.tsx
│       │   │   ├── hooks/
│       │   │   │   └── useWeather.ts
│       │   │   └── index.tsx
│       │   ├── Tabs/
│       │   │   └── index.tsx
│       │   ├── TitleBar/
│       │   │   └── index.tsx
│       │   ├── WebView/
│       │   │   └── index.tsx
│       │   ├── WelcomePage/
│       │   │   └── index.tsx
│       │   └── ZenSidebar/
│       │       ├── components/
│       │       │   ├── BottomSection.tsx
│       │       │   ├── QuickSitesSection.tsx
│       │       │   ├── TabItem.tsx
│       │       │   ├── TabsSection.tsx
│       │       │   └── WorkspaceSection.tsx
│       │       ├── icons/
│       │       │   └── index.tsx
│       │       └── index.tsx
│       ├── constants/
│       │   └── index.ts
│       ├── hooks/
│       │   ├── index.ts
│       │   ├── useAppHandlers.ts
│       │   ├── useAppState.ts
│       │   ├── useAutofill.ts
│       │   ├── useBookmarks.ts
│       │   ├── useHistory.ts
│       │   ├── useNavigation.ts
│       │   ├── useSession.ts
│       │   ├── useShortcuts.ts
│       │   ├── useStartPageData.ts
│       │   ├── useTabMemory.ts
│       │   ├── useTabThumbnails.ts
│       │   ├── useTranslation.ts
│       │   ├── useWallpaper.ts
│       │   ├── useWebViewVisibility.ts
│       │   ├── useWorkspaces.ts
│       │   └── useZoom.ts
│       ├── i18n/
│       │   ├── en.json
│       │   ├── index.ts
│       │   └── ru.json
│       ├── styles/
│       │   ├── common/
│       │   │   ├── animations.css
│       │   │   ├── index.css
│       │   │   ├── reset.css
│       │   │   ├── scrollbar.css
│       │   │   └── variables.css
│       │   ├── components/
│       │   │   ├── address-bar/
│       │   │   │   └── index.css
│       │   │   ├── address-bar.css
│       │   │   ├── banners/
│       │   │   │   └── index.css
│       │   │   ├── banners.css
│       │   │   ├── clock-widget/
│       │   │   │   └── index.css
│       │   │   ├── clock-widget.css
│       │   │   ├── download-indicator/
│       │   │   │   └── index.css
│       │   │   ├── download-indicator.css
│       │   │   ├── downloads-page/
│       │   │   │   └── index.css
│       │   │   ├── downloads-page.css
│       │   │   ├── frozen-tab/
│       │   │   │   └── index.css
│       │   │   ├── frozen-tab.css
│       │   │   ├── history-page/
│       │   │   │   └── index.css
│       │   │   ├── history-page.css
│       │   │   ├── import-dialog/
│       │   │   │   └── index.css
│       │   │   ├── import-dialog.css
│       │   │   ├── new-tab-modal/
│       │   │   │   └── index.css
│       │   │   ├── new-tab-modal.css
│       │   │   ├── quick-sites/
│       │   │   │   └── index.css
│       │   │   ├── quick-sites.css
│       │   │   ├── quicksites-page/
│       │   │   │   └── index.css
│       │   │   ├── quicksites-page.css
│       │   │   ├── search-box/
│       │   │   │   └── index.css
│       │   │   ├── search-box.css
│       │   │   ├── settings/
│       │   │   │   ├── about.css
│       │   │   │   ├── appearance.css
│       │   │   │   ├── controls.css
│       │   │   │   ├── index.css
│       │   │   │   ├── layout.css
│       │   │   │   ├── navigation.css
│       │   │   │   ├── passwords.css
│       │   │   │   └── search.css
│       │   │   ├── settings.css
│       │   │   ├── split-view/
│       │   │   │   └── index.css
│       │   │   ├── split-view.css
│       │   │   ├── tab-bar/
│       │   │   │   └── index.css
│       │   │   ├── tab-bar.css
│       │   │   ├── tab-search/
│       │   │   │   └── index.css
│       │   │   ├── tab-search.css
│       │   │   ├── title-bar/
│       │   │   │   └── index.css
│       │   │   ├── title-bar.css
│       │   │   ├── toast/
│       │   │   │   └── index.css
│       │   │   ├── toast.css
│       │   │   ├── weather-widget/
│       │   │   │   └── index.css
│       │   │   ├── weather-widget.css
│       │   │   ├── webview-container/
│       │   │   │   └── index.css
│       │   │   ├── webview-container.css
│       │   │   ├── welcome-page/
│       │   │   │   ├── accent.css
│       │   │   │   ├── actions.css
│       │   │   │   ├── base.css
│       │   │   │   ├── features.css
│       │   │   │   ├── header.css
│       │   │   │   ├── import.css
│       │   │   │   ├── index.css
│       │   │   │   ├── layout.css
│       │   │   │   ├── page-dots.css
│       │   │   │   ├── responsive.css
│       │   │   │   ├── slider.css
│       │   │   │   └── window-controls.css
│       │   │   └── welcome-page.css
│       │   ├── global.css
│       │   ├── layout/
│       │   │   ├── app.css
│       │   │   ├── fullscreen.css
│       │   │   ├── index.css
│       │   │   ├── responsive.css
│       │   │   └── webview.css
│       │   ├── pages/
│       │   │   ├── .gitkeep
│       │   │   └── start-page.css
│       │   ├── sidebar/
│       │   │   ├── _animations.css
│       │   │   ├── _base.css
│       │   │   ├── _bottom.css
│       │   │   ├── _color-picker.css
│       │   │   ├── _context-menu.css
│       │   │   ├── _icon-picker.css
│       │   │   ├── _navigation.css
│       │   │   ├── _quick-sites.css
│       │   │   ├── _resize.css
│       │   │   ├── _responsive.css
│       │   │   ├── _scrollbar.css
│       │   │   ├── _search.css
│       │   │   ├── _tabs.css
│       │   │   ├── _variants.css
│       │   │   ├── _window-controls.css
│       │   │   ├── _workspaces.css
│       │   │   └── index.css
│       │   └── themes/
│       │       ├── dark/
│       │       │   ├── address-bar.css
│       │       │   ├── components.css
│       │       │   ├── downloads.css
│       │       │   ├── history.css
│       │       │   ├── layout.css
│       │       │   ├── settings.css
│       │       │   ├── sidebar.css
│       │       │   ├── start-page.css
│       │       │   └── variables.css
│       │       ├── dark.css
│       │       ├── index.css
│       │       ├── light/
│       │       │   ├── address-bar.css
│       │       │   ├── components.css
│       │       │   ├── downloads.css
│       │       │   ├── history.css
│       │       │   ├── layout.css
│       │       │   ├── settings.css
│       │       │   ├── sidebar.css
│       │       │   ├── start-page.css
│       │       │   └── variables.css
│       │       └── light.css
│       ├── types/
│       │   └── index.ts
│       ├── utils/
│       │   └── url.ts
│       ├── App.tsx
│       ├── index.html
│       ├── main.tsx
│       ├── tauri-api.ts
│       └── vite-env.d.ts
├── src-tauri/
│   ├── icons/
│   │   ├── 128x128.png
│   │   ├── 32x32.png
│   │   ├── icon.ico
│   │   └── icon.png
│   ├── src/
│   │   ├── adblock/
│   │   │   ├── commands.rs
│   │   │   └── mod.rs
│   │   ├── downloads/
│   │   │   ├── downloader.rs
│   │   │   ├── mod.rs
│   │   │   ├── storage.rs
│   │   │   ├── types.rs
│   │   │   └── utils.rs
│   │   ├── scripts/
│   │   │   ├── mod.rs
│   │   │   ├── autofill.js
│   │   │   └── page_observer.js
│   │   ├── storage/
│   │   │   ├── passwords/
│   │   │   │   ├── crypto.rs
│   │   │   │   ├── mod.rs
│   │   │   │   ├── operations.rs
│   │   │   │   ├── types.rs
│   │   │   │   └── vault.rs
│   │   │   ├── bookmarks.rs
│   │   │   ├── history.rs
│   │   │   ├── import.rs
│   │   │   ├── mod.rs
│   │   │   ├── session.rs
│   │   │   └── settings.rs
│   │   ├── webview_manager/
│   │   │   ├── commands/
│   │   │   │   ├── lifecycle/
│   │   │   │   │   ├── close.rs
│   │   │   │   │   ├── create.rs
│   │   │   │   │   ├── download_handler.rs
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   └── utils.rs
│   │   │   │   ├── misc/
│   │   │   │   │   ├── reader_mode/
│   │   │   │   │   │   ├── content_finder.rs
│   │   │   │   │   │   ├── metadata.rs
│   │   │   │   │   │   ├── mod.rs
│   │   │   │   │   │   ├── notifications.rs
│   │   │   │   │   │   ├── script.rs
│   │   │   │   │   │   ├── site_detection.rs
│   │   │   │   │   │   ├── styles.rs
│   │   │   │   │   │   ├── template.rs
│   │   │   │   │   │   └── unsupported_sites.rs
│   │   │   │   │   ├── mod.rs
│   │   │   │   │   ├── page_info.rs
│   │   │   │   │   ├── pip.rs
│   │   │   │   │   ├── script.rs
│   │   │   │   │   └── zoom.rs
│   │   │   │   ├── info.rs
│   │   │   │   ├── mod.rs
│   │   │   │   ├── navigation.rs
│   │   │   │   └── visibility.rs
│   │   │   ├── manager.rs
│   │   │   ├── mod.rs
│   │   │   ├── polling.rs
│   │   │   └── types.rs
│   │   ├── commands.rs
│   │   └── main.rs
│   ├── build.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── .gitignore
├── package.json
├── README.md
├── soon.md
├── tsconfig.json
└── vite.config.ts
```

## Directory Overview

| Directory | Description |
|-----------|-------------|
| `.kiro/steering/` | Project documentation (product, structure, tech specs) |
| `public/` | Static assets (icons, wallpapers, autofill script) |
| `src/renderer/` | Frontend React application |
| `src/renderer/components/` | React components (AddressBar, Autofill, Downloads, etc.) |
| `src/renderer/hooks/` | Custom React hooks (17 hooks) |
| `src/renderer/i18n/` | Internationalization (EN, RU, ES, FR, DE, ZH-CN) |
| `src/renderer/styles/` | CSS styles (components, themes, layout) |
| `src-tauri/` | Tauri backend (Rust) |
| `src-tauri/src/adblock/` | Ad blocking functionality |
| `src-tauri/src/downloads/` | Download manager |
| `src-tauri/src/scripts/` | JavaScript injection scripts (autofill, page observer) |
| `src-tauri/src/storage/` | Data persistence (bookmarks, history, passwords, settings) |
| `src-tauri/src/webview_manager/` | WebView management and commands |
| `src-tauri/src/webview_manager/commands/lifecycle/` | WebView create/close/download handling |
| `src-tauri/src/webview_manager/commands/misc/` | Scripts, zoom, PiP, reader mode |

## Tech Stack

- **Frontend**: React 18 + TypeScript 5 + Vite 5
- **Backend**: Tauri 2.0 (Rust Edition 2021)
- **WebView**: Native WebView2 via webview2-com
- **Database**: SQLite (rusqlite)
- **Styling**: CSS with themes (dark/light)
- **i18n**: Custom implementation (EN, RU, ES, FR, DE, ZH-CN)
