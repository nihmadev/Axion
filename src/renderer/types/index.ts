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
  isFrozen?: boolean; 
  lastActiveAt?: number; 
  thumbnail?: string; 
  thumbnailUpdatedAt?: number; 
  isReaderMode?: boolean; 
  groupId?: string; 
}


export const TAB_GROUP_COLORS = [
  { id: 'grey', color: '#5f6368', name: 'Серый' },
  { id: 'blue', color: '#1a73e8', name: 'Синий' },
  { id: 'red', color: '#d93025', name: 'Красный' },
  { id: 'yellow', color: '#f9ab00', name: 'Жёлтый' },
  { id: 'green', color: '#1e8e3e', name: 'Зелёный' },
  { id: 'pink', color: '#d01884', name: 'Розовый' },
  { id: 'purple', color: '#a142f4', name: 'Фиолетовый' },
  { id: 'cyan', color: '#007b83', name: 'Бирюзовый' },
  { id: 'orange', color: '#fa903e', name: 'Оранжевый' },
] as const;

export type TabGroupColorId = typeof TAB_GROUP_COLORS[number]['id'];

export interface TabGroup {
  id: string;
  name: string;
  colorId: TabGroupColorId;
  collapsed: boolean; 
}

export type Language = 'ru' | 'en' | 'es' | 'fr' | 'de' | 'zh-CN';


export function getSystemLanguage(): Language {
  const browserLang = navigator.language;
  const supportedLanguages: Language[] = ['ru', 'en', 'es', 'fr', 'de', 'zh-CN'];
  
  
  if (supportedLanguages.includes(browserLang as Language)) {
    return browserLang as Language;
  }
  
  
  const langPrefix = browserLang.split('-')[0].toLowerCase();
  if (langPrefix === 'zh') {
    return 'zh-CN';
  }
  
  return supportedLanguages.includes(langPrefix as Language) 
    ? (langPrefix as Language) 
    : 'en';
}


export function getSystemTimeFormat(): '12h' | '24h' {
  const testDate = new Date(2000, 0, 1, 13, 0, 0);
  const formatted = testDate.toLocaleTimeString(navigator.language, { hour: 'numeric' });
  
  return /am|pm/i.test(formatted) || parseInt(formatted) < 13 ? '12h' : '24h';
}

export interface TabError {
  code: number;
  description: string;
}

export interface SplitView {
  enabled: boolean;
  leftTabId: string | null;
  rightTabId: string | null;
  splitRatio: number; 
}

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  activeTabId: string;
  tabs: Tab[];
  splitView?: SplitView;
  tabGroups?: TabGroup[]; 
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
  
  searchEngine: 'google' | 'duckduckgo' | 'bing';
  
  
  theme: 'dark' | 'light' | 'custom';
  accentColor: string;
  fontSize: number;
  fontFamily: 'system' | 'inter' | 'roboto' | 'jetbrains';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  
  
  sidebarPosition: 'left' | 'right';
  sidebarStyle: 'default' | 'compact' | 'minimal';
  sidebarAutoHide: boolean;
  showSidebarQuickSites: boolean;
  showSidebarWorkspaces: boolean;
  showSidebarNavigation: boolean;
  
  
  tabPosition: 'top' | 'bottom' | 'left' | 'right';
  tabStyle: 'default' | 'compact' | 'pills';
  showTabPreviews: boolean;
  showTabFavicons: boolean;
  tabCloseButton: 'hover' | 'always' | 'never';
  
  
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
  
  
  adBlockEnabled: boolean;
  trackingProtection: boolean;
  httpsOnly: boolean;
  clearDataOnExit: boolean;
  
  
  dohEnabled: boolean;
  dohProvider: 'cloudflare' | 'google' | 'quad9' | 'adguard' | 'custom';
  dohCustomUrl: string;
  
  
  hardwareAcceleration: boolean;
  tabSuspension: boolean;
  tabSuspensionTimeout: number;
  preloadPages: boolean;
  
  
  showBookmarksBar: boolean;
  readerModeEnabled: boolean;
  smoothScrolling: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  downloadPath: string;
  language: Language;
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


export function createDefaultSettings(): Settings {
  return {
    
    searchEngine: 'google',
    
    
    theme: 'dark',
    accentColor: '#7c3aed',
    fontSize: 14,
    fontFamily: 'system',
    borderRadius: 'medium',
    
    
    sidebarPosition: 'right',
    sidebarStyle: 'default',
    sidebarAutoHide: false,
    showSidebarQuickSites: true,
    showSidebarWorkspaces: true,
    showSidebarNavigation: true,
    
    
    tabPosition: 'top',
    tabStyle: 'default',
    showTabPreviews: true,
    showTabFavicons: true,
    tabCloseButton: 'hover',
    
    
    startPageBackground: 'gradient',
    wallpaperUrl: '/walpaper1.jpg',
    wallpaperBlur: 0,
    wallpaperDim: 20,
    showWeather: true,
    showQuotes: false,
    showTodos: false,
    showClock: true,
    clockFormat: getSystemTimeFormat(), 
    showSearchOnStartPage: true,
    showQuickSitesOnStartPage: true,
    quickSitesLayout: 'grid',
    
    
    adBlockEnabled: true,
    trackingProtection: true,
    httpsOnly: false,
    clearDataOnExit: false,
    
    
    dohEnabled: false,
    dohProvider: 'cloudflare',
    dohCustomUrl: '',
    
    
    hardwareAcceleration: true,
    tabSuspension: true,
    tabSuspensionTimeout: 30,
    preloadPages: false,
    
    
    showBookmarksBar: true,
    readerModeEnabled: false,
    smoothScrolling: true,
    animationsEnabled: true,
    soundEnabled: true,
    notificationsEnabled: true,
    downloadPath: '',
    language: getSystemLanguage(), 
    showWelcomeOnNextLaunch: false,
  };
}


export const defaultSettings: Settings = {
  searchEngine: 'google',
  theme: 'dark',
  accentColor: '#7c3aed',
  fontSize: 14,
  fontFamily: 'system',
  borderRadius: 'medium',
  sidebarPosition: 'right',
  sidebarStyle: 'default',
  sidebarAutoHide: false,
  showSidebarQuickSites: true,
  showSidebarWorkspaces: true,
  showSidebarNavigation: true,
  tabPosition: 'top',
  tabStyle: 'default',
  showTabPreviews: true,
  showTabFavicons: true,
  tabCloseButton: 'hover',
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
  adBlockEnabled: true,
  trackingProtection: true,
  httpsOnly: false,
  clearDataOnExit: false,
  dohEnabled: false,
  dohProvider: 'cloudflare',
  dohCustomUrl: '',
  hardwareAcceleration: true,
  tabSuspension: true,
  tabSuspensionTimeout: 30,
  preloadPages: false,
  showBookmarksBar: true,
  readerModeEnabled: false,
  smoothScrolling: true,
  animationsEnabled: true,
  soundEnabled: true,
  notificationsEnabled: true,
  downloadPath: '',
  language: 'en',
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
      
      freezeTab: (tabId: string) => Promise<boolean>;
      unfreezeTab: (tabId: string) => Promise<boolean>;
      isTabFrozen: (tabId: string) => Promise<boolean>;
      
      getDownloads: () => Promise<Download[]>;
      onDownloadStarted: (callback: (download: Download) => void) => () => void;
      onDownloadUpdate: (callback: (download: Download) => void) => () => void;
      onDownloadProgress: (callback: (download: Download) => void) => () => void;
      onDownloadCompleted: (callback: (download: Download) => void) => () => void;
      cancelDownload: (id: string) => Promise<void>;
      openDownload: (path: string) => Promise<void>;
      showDownloadInFolder: (path: string) => Promise<void>;
      clearCompletedDownloads: () => Promise<void>;
      
      importFromBrowser: (browser: 'chrome' | 'firefox' | 'edge' | 'zen') => Promise<{ bookmarks: Bookmark[], history: HistoryEntry[] } | null>;
      detectBrowsers: () => Promise<DetectedBrowser[]>;
      
      isFirstLaunch: () => Promise<boolean>;
      markInitialized: () => Promise<void>;
      
      checkForUpdates: () => Promise<void>;
      onUpdateAvailable: (callback: (info: any) => void) => () => void;
      onUpdateDownloaded: (callback: () => void) => () => void;
      installUpdate: () => Promise<void>;
      
      saveSession: (sessionData: any) => Promise<boolean>;
      restoreSession: () => Promise<any | null>;
      clearSession: () => Promise<boolean>;
      
      getPartitionSession: (partition: string) => Promise<boolean>;
      
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
