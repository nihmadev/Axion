export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  pinned?: boolean;
  zoomLevel?: number;
  error?: TabError | null;
  isSecure?: boolean;
  isFrozen?: boolean; // Вкладка заморожена для экономии памяти
  lastActiveAt?: number; // Время последней активности
  thumbnail?: string; // Base64 скриншот страницы для превью
  thumbnailUpdatedAt?: number; // Время последнего обновления скриншота
}

export type Language = 'ru' | 'en';

export interface TabError {
  code: number;
  description: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  activeTabId: string;
  tabs: Tab[];
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  createdAt: number;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitedAt: number;
}

export interface Settings {
  // Поиск
  searchEngine: 'google' | 'duckduckgo' | 'bing';
  
  // Внешний вид
  theme: 'dark' | 'light' | 'custom';
  accentColor: string;
  fontSize: number;
  fontFamily: 'system' | 'inter' | 'roboto' | 'jetbrains';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  
  // Сайдбар
  sidebarPosition: 'left' | 'right';
  sidebarStyle: 'default' | 'compact' | 'minimal';
  sidebarAutoHide: boolean;
  showSidebarQuickSites: boolean;
  showSidebarWorkspaces: boolean;
  showSidebarNavigation: boolean;
  
  // Вкладки
  tabPosition: 'top' | 'bottom' | 'left' | 'right';
  tabStyle: 'default' | 'compact' | 'pills';
  showTabPreviews: boolean;
  showTabFavicons: boolean;
  tabCloseButton: 'hover' | 'always' | 'never';
  
  // Стартовая страница
  startPageBackground: string;
  wallpaperUrl: string;
  wallpaperBlur: number;
  wallpaperDim: number;
  showWeather: boolean;
  showQuotes: boolean;
  showTodos: boolean;
  showClock: boolean;
  clockFormat: '12h' | '24h';
  showSearchOnStartPage: boolean;
  showQuickSitesOnStartPage: boolean;
  quickSitesLayout: 'grid' | 'list' | 'compact';
  
  // Приватность и безопасность
  adBlockEnabled: boolean;
  trackingProtection: boolean;
  httpsOnly: boolean;
  clearDataOnExit: boolean;
  
  // Производительность
  hardwareAcceleration: boolean;
  tabSuspension: boolean;
  tabSuspensionTimeout: number;
  preloadPages: boolean;
  
  // Дополнительно
  showBookmarksBar: boolean;
  readerModeEnabled: boolean;
  smoothScrolling: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  downloadPath: string;
  language: 'ru' | 'en';
  showWelcomeOnNextLaunch: boolean;
}

export interface QuickAccess {
  id: string;
  url: string;
  title: string;
  icon?: string;
}

export interface DetectedBrowser {
  id: string;
  name: string;
  available: boolean;
}

export const defaultSettings: Settings = {
  // Поиск
  searchEngine: 'google',
  
  // Внешний вид
  theme: 'dark',
  accentColor: '#7c3aed',
  fontSize: 14,
  fontFamily: 'system',
  borderRadius: 'medium',
  
  // Сайдбар
  sidebarPosition: 'right',
  sidebarStyle: 'default',
  sidebarAutoHide: false,
  showSidebarQuickSites: true,
  showSidebarWorkspaces: true,
  showSidebarNavigation: true,
  
  // Вкладки
  tabPosition: 'top',
  tabStyle: 'default',
  showTabPreviews: true,
  showTabFavicons: true,
  tabCloseButton: 'hover',
  
  // Стартовая страница
  startPageBackground: 'gradient',
  wallpaperUrl: '/walpaper1.jpg',
  wallpaperBlur: 0,
  wallpaperDim: 20,
  showWeather: true,
  showQuotes: false,
  showTodos: false,
  showClock: true,
  clockFormat: '24h',
  showSearchOnStartPage: true,
  showQuickSitesOnStartPage: true,
  quickSitesLayout: 'grid',
  
  // Приватность и безопасность
  adBlockEnabled: true,
  trackingProtection: true,
  httpsOnly: false,
  clearDataOnExit: false,
  
  // Производительность
  hardwareAcceleration: true,
  tabSuspension: true,
  tabSuspensionTimeout: 30,
  preloadPages: false,
  
  // Дополнительно
  showBookmarksBar: true,
  readerModeEnabled: false,
  smoothScrolling: true,
  animationsEnabled: true,
  soundEnabled: true,
  notificationsEnabled: true,
  downloadPath: '',
  language: 'ru',
  showWelcomeOnNextLaunch: false,
};

export interface Download {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: number;
  savePath?: string;
}

declare global {
  interface Window {
    electronAPI: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      fullscreen: () => Promise<void>;
      isFullscreen: () => Promise<boolean>;
      getSettings: () => Promise<Settings>;
      setSettings: (settings: Settings) => Promise<void>;
      getBookmarks: () => Promise<Bookmark[]>;
      setBookmarks: (bookmarks: Bookmark[]) => Promise<void>;
      getHistory: () => Promise<HistoryEntry[]>;
      addHistory: (entry: HistoryEntry) => Promise<void>;
      clearHistory: () => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      showSaveDialog: (options: any) => Promise<any>;
      showError: (title: string, message: string) => Promise<void>;
      onShortcut: (callback: (action: string) => void) => () => void;
      onFullscreenChange: (callback: (isFullscreen: boolean) => void) => () => void;
      onOpenUrl: (callback: (url: string) => void) => () => void;
      exportBookmarks: (bookmarks: Bookmark[]) => Promise<boolean>;
      importBookmarks: () => Promise<Bookmark[] | null>;
      // Memory management
      freezeTab: (tabId: string) => Promise<boolean>;
      unfreezeTab: (tabId: string) => Promise<boolean>;
      isTabFrozen: (tabId: string) => Promise<boolean>;
      // Downloads
      getDownloads: () => Promise<Download[]>;
      onDownloadUpdate: (callback: (download: Download) => void) => () => void;
      cancelDownload: (id: string) => Promise<void>;
      openDownload: (path: string) => Promise<void>;
      showDownloadInFolder: (path: string) => Promise<void>;
      clearCompletedDownloads: () => Promise<void>;
      // Browser import
      importFromBrowser: (browser: 'chrome' | 'firefox' | 'edge' | 'zen') => Promise<{ bookmarks: Bookmark[], history: HistoryEntry[] } | null>;
      detectBrowsers: () => Promise<DetectedBrowser[]>;
      // First launch
      isFirstLaunch: () => Promise<boolean>;
      markInitialized: () => Promise<void>;
      // Auto-update
      checkForUpdates: () => Promise<void>;
      onUpdateAvailable: (callback: (info: any) => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      installUpdate: () => Promise<void>;
      // Session restore
      saveSession: (sessionData: any) => Promise<boolean>;
      restoreSession: () => Promise<any | null>;
      clearSession: () => Promise<boolean>;
      // Partition sessions
      getPartitionSession: (partition: string) => Promise<boolean>;
      // WebView2 commands
      webViewGoBack: (id: string) => Promise<boolean>;
      webViewGoForward: (id: string) => Promise<boolean>;
      webViewReload: (id: string) => Promise<void>;
      webViewStop: (id: string) => Promise<void>;
      getWebViewUrl: (id: string) => Promise<string>;
      closeWebView: (id: string) => Promise<void>;
      setWebViewVisible: (id: string, visible: boolean) => Promise<void>;
      updateWebViewBounds: (id: string, bounds: { x: number; y: number; width: number; height: number }) => Promise<void>;
      getRealPageInfo: (id: string) => Promise<{ id: string; url: string; title: string; favicon?: string; is_loading: boolean }>;
      onWebViewUrlChanged: (callback: (data: { id: string; url?: string; title?: string; favicon?: string; is_loading?: boolean }) => void) => () => void;
      onPageInfoUpdate: (callback: (data: { id: string; title: string; url: string }) => void) => () => void;
    };
    electron?: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
      };
    };
  }
}
