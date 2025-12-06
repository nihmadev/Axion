import React from 'react';
import { Settings } from '../../../types';
import { Translations } from '../../../i18n';
import { Toggle, Select, SettingItem } from '../SettingsComponents';
import { ACCENT_COLORS } from '../constants';
import { GoogleIcon, DuckDuckGoIcon, BingIcon} from '../SearchEngineIcons';

interface AppearanceSettingsProps {
  settings: Settings;
  onUpdate: (s: Partial<Settings>) => void;
  t: Translations;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ settings, onUpdate, t }) => {
  const searchEngines = [
    { id: 'google', name: 'Google', icon: <GoogleIcon /> },
    { id: 'duckduckgo', name: 'DuckDuckGo', icon: <DuckDuckGoIcon /> },
    { id: 'bing', name: 'Bing', icon: <BingIcon /> },
  ];

  return (
    <>
      <div className="settings-page-section">
        <h2>{t.settings.search}</h2>
        <div className="settings-page-item search-engine-item">
          <div className="settings-page-item-info">
            <label>{t.settings.searchEngine}</label>
            <span>{t.settings.searchEngineDesc}</span>
          </div>
          <div className="search-engine-selector">
            {searchEngines.map((engine) => (
              <button
                key={engine.id}
                className={`search-engine-option ${settings.searchEngine === engine.id ? 'active' : ''}`}
                onClick={() => onUpdate({ searchEngine: engine.id as Settings['searchEngine'] })}
              >
                {engine.icon}
                <span>{engine.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-page-section">
        <h2>{t.settings.theme}</h2>
        <SettingItem label={t.settings.colorScheme} description={t.settings.colorSchemeDesc}>
          <div className="theme-selector">
            <button
              className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => onUpdate({ theme: 'dark' })}
            >
              <div className="theme-preview dark">
                <div className="theme-preview-sidebar" />
                <div className="theme-preview-content" />
              </div>
              <span>{t.settings.themeDark}</span>
            </button>
            <button
              className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
              onClick={() => onUpdate({ theme: 'light' })}
            >
              <div className="theme-preview light">
                <div className="theme-preview-sidebar" />
                <div className="theme-preview-content" />
              </div>
              <span>{t.settings.themeLight}</span>
            </button>
          </div>
        </SettingItem>

        <SettingItem label={t.settings.accentColor} description={t.settings.accentColorDesc}>
          <div className="color-picker-row">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                className={`color-preset ${settings.accentColor === color ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => onUpdate({ accentColor: color })}
              />
            ))}
            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) => onUpdate({ accentColor: e.target.value })}
              className="color-input-custom"
            />
          </div>
        </SettingItem>

        <SettingItem label={t.settings.fontSize} description={`${settings.fontSize}px`}>
          <input
            type="range"
            min="12"
            max="18"
            value={settings.fontSize}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          />
        </SettingItem>

        <SettingItem label={t.settings.fontFamily} description={t.settings.fontFamilyDesc}>
          <Select
            value={settings.fontFamily}
            options={[
              { value: 'system', label: t.settings.fontSystem },
              { value: 'inter', label: 'Inter' },
              { value: 'roboto', label: 'Roboto' },
              { value: 'jetbrains', label: 'JetBrains Mono' },
            ]}
            onChange={(v) => onUpdate({ fontFamily: v as Settings['fontFamily'] })}
          />
        </SettingItem>

        <SettingItem label={t.settings.borderRadius} description={t.settings.borderRadiusDesc}>
          <div className="radius-selector">
            {(['none', 'small', 'medium', 'large'] as const).map((r) => (
              <button
                key={r}
                className={`radius-option ${settings.borderRadius === r ? 'active' : ''}`}
                onClick={() => onUpdate({ borderRadius: r })}
              >
                <div className={`radius-preview radius-${r}`} />
                <span>{r === 'none' ? t.settings.radiusNone : r === 'small' ? t.settings.radiusSmall : r === 'medium' ? t.settings.radiusMedium : t.settings.radiusLarge}</span>
              </button>
            ))}
          </div>
        </SettingItem>

        <SettingItem label={t.settings.animations} description={t.settings.animationsDesc}>
          <Toggle checked={settings.animationsEnabled} onChange={(v) => onUpdate({ animationsEnabled: v })} />
        </SettingItem>
      </div>
    </>
  );
};
