import { Settings } from '../../types';
import { Translations } from '../../i18n';

export type SettingsTab = 'appearance' | 'sidebar' | 'tabs' | 'startpage' | 'privacy' | 'performance' | 'advanced';

export interface SettingsTabProps {
  settings: Settings;
  onUpdate: (settings: Partial<Settings>) => void;
  t: Translations;
}

export interface TabConfig {
  id: SettingsTab;
  label: string;
  icon: JSX.Element;
}
