import React from 'react';
import { SettingsTabProps } from '../types';
import { Toggle, Select, SettingItem } from '../SettingsComponents';
import browserIcon from '../../../icon.png';

export const AdvancedSettings: React.FC<SettingsTabProps> = ({ settings, onUpdate, t }) => (
  <>
    <div className="settings-page-section">
      <h2>{t.settings.interface}</h2>
      <SettingItem label={t.settings.bookmarksBar} description={t.settings.bookmarksBarDesc}>
        <Toggle checked={settings.showBookmarksBar} onChange={(v) => onUpdate({ showBookmarksBar: v })} />
      </SettingItem>

      <SettingItem label={t.settings.readerMode} description={t.settings.readerModeDesc}>
        <Toggle checked={settings.readerModeEnabled} onChange={(v) => onUpdate({ readerModeEnabled: v })} />
      </SettingItem>

      <SettingItem label={t.settings.language} description={t.settings.languageDesc}>
        <Select
          value={settings.language}
          options={[
            { value: 'ru', label: 'Русский' },
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' },
          ]}
          onChange={(v) => onUpdate({ language: v as typeof settings.language })}
        />
      </SettingItem>
    </div>

    <div className="settings-page-section">
      <h2>{t.settings.notifications}</h2>
      <SettingItem label={t.settings.sounds} description={t.settings.soundsDesc}>
        <Toggle checked={settings.soundEnabled} onChange={(v) => onUpdate({ soundEnabled: v })} />
      </SettingItem>

      <SettingItem label={t.settings.notificationsEnabled} description={t.settings.notificationsEnabledDesc}>
        <Toggle checked={settings.notificationsEnabled} onChange={(v) => onUpdate({ notificationsEnabled: v })} />
      </SettingItem>

      <SettingItem label={t.settings.showWelcomeOnNextLaunch} description={t.settings.showWelcomeOnNextLaunchDesc}>
        <Toggle checked={settings.showWelcomeOnNextLaunch} onChange={(v) => onUpdate({ showWelcomeOnNextLaunch: v })} />
      </SettingItem>
    </div>

    <div className="settings-page-section">
      <h2>{t.settings.aboutBrowser}</h2>
      <div className="about-browser">
        <div className="about-logo">
          <img src={browserIcon} alt="Axion Browser" width="48" height="48" />
        </div>
        <div className="about-info">
          <h3>Axion Browser</h3>
          <p>{t.settings.version} 1.7.9</p>
          <p className="about-copyright">{t.settings.copyright}</p>
        </div>
      </div>
    </div>
  </>
);
