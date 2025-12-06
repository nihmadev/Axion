import React from 'react';
import { SettingsTabProps } from '../types';
import { Toggle, SettingItem } from '../SettingsComponents';

export const PerformanceSettings: React.FC<SettingsTabProps> = ({ settings, onUpdate, t }) => (
  <>
    <div className="settings-page-section">
      <h2>{t.settings.acceleration}</h2>
      <SettingItem label={t.settings.hardwareAcceleration} description={t.settings.hardwareAccelerationDesc}>
        <Toggle checked={settings.hardwareAcceleration} onChange={(v) => onUpdate({ hardwareAcceleration: v })} />
      </SettingItem>

      <SettingItem label={t.settings.smoothScrolling} description={t.settings.smoothScrollingDesc}>
        <Toggle checked={settings.smoothScrolling} onChange={(v) => onUpdate({ smoothScrolling: v })} />
      </SettingItem>

      <SettingItem label={t.settings.preloadPages} description={t.settings.preloadPagesDesc}>
        <Toggle checked={settings.preloadPages} onChange={(v) => onUpdate({ preloadPages: v })} />
      </SettingItem>
    </div>

    <div className="settings-page-section">
      <h2>{t.settings.memory}</h2>
      <SettingItem label={t.settings.tabSuspension} description={t.settings.tabSuspensionDesc}>
        <Toggle checked={settings.tabSuspension} onChange={(v) => onUpdate({ tabSuspension: v })} />
      </SettingItem>

      {settings.tabSuspension && (
        <SettingItem label={t.settings.suspensionTimeout} description={`${settings.tabSuspensionTimeout} ${t.settings.suspensionTimeoutDesc}`}>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={settings.tabSuspensionTimeout}
            onChange={(e) => onUpdate({ tabSuspensionTimeout: parseInt(e.target.value) })}
          />
        </SettingItem>
      )}
    </div>
  </>
);
