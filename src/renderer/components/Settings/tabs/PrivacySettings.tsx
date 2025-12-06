import React from 'react';
import { SettingsTabProps } from '../types';
import { Toggle, SettingItem } from '../SettingsComponents';

export const PrivacySettings: React.FC<SettingsTabProps> = ({ settings, onUpdate, t }) => (
  <>
    <div className="settings-page-section">
      <h2>{t.settings.protection}</h2>
      <SettingItem label={t.settings.adBlock} description={t.settings.adBlockDesc}>
        <Toggle checked={settings.adBlockEnabled} onChange={(v) => onUpdate({ adBlockEnabled: v })} />
      </SettingItem>

      <SettingItem label={t.settings.trackingProtection} description={t.settings.trackingProtectionDesc}>
        <Toggle checked={settings.trackingProtection} onChange={(v) => onUpdate({ trackingProtection: v })} />
      </SettingItem>

      <SettingItem label={t.settings.httpsOnly} description={t.settings.httpsOnlyDesc}>
        <Toggle checked={settings.httpsOnly} onChange={(v) => onUpdate({ httpsOnly: v })} />
      </SettingItem>
    </div>

    <div className="settings-page-section">
      <h2>{t.settings.data}</h2>
      <SettingItem label={t.settings.clearOnExit} description={t.settings.clearOnExitDesc}>
        <Toggle checked={settings.clearDataOnExit} onChange={(v) => onUpdate({ clearDataOnExit: v })} />
      </SettingItem>
    </div>
  </>
);
