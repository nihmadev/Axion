import { Settings } from '../../types';
import { Language } from '../../i18n';

export interface StartPageProps {
  settings: Settings;
  language?: Language;
  onNavigate: (url: string) => void;
  recentSites?: Array<{ url: string; title: string; favicon?: string }>;
  hiddenSites?: string[];
  renamedSites?: Record<string, string>;
  onHideSite?: (url: string) => void;
  onDeleteSite?: (url: string) => void;
  onRenameSite?: (url: string, newName: string) => void;
}

export interface WeatherData {
  temp: number;
  weatherCode: number;
  icon: React.ReactNode;
  location: string;
}

export interface DisplaySite {
  name: string;
  url: string;
  icon: string;
}
