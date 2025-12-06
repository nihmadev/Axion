import React from 'react';
import { SettingsTabProps } from '../types';
import { Toggle, Select, SettingItem } from '../SettingsComponents';
import { WALLPAPER_PRESETS } from '../constants';

export const StartPageSettings: React.FC<SettingsTabProps> = ({ settings, onUpdate, t }) => (
  <>
    <div className="settings-page-section">
      <h2>{t.settings.background}</h2>
      <div className="settings-page-item wallpaper-item">
        <div className="settings-page-item-info">
          <label>{t.settings.wallpaper}</label>
          <span>{t.settings.wallpaperDesc}</span>
        </div>
        <div className="wallpaper-presets-grid">
          {WALLPAPER_PRESETS.map((url, idx) => (
            <button
              key={idx}
              className={`wallpaper-preset-btn ${settings.wallpaperUrl === url ? 'active' : ''}`}
              style={{ backgroundImage: `url(${url})` }}
              onClick={() => onUpdate({ wallpaperUrl: url })}
            />
          ))}
        </div>
      </div>

      <SettingItem label={t.settings.backgroundBlur} description={`${settings.wallpaperBlur}px`}>
        <input
          type="range"
          min="0"
          max="30"
          value={settings.wallpaperBlur}
          onChange={(e) => onUpdate({ wallpaperBlur: parseInt(e.target.value) })}
        />
      </SettingItem>

      <SettingItem label={t.settings.backgroundDim} description={`${settings.wallpaperDim}%`}>
        <input
          type="range"
          min="0"
          max="80"
          value={settings.wallpaperDim}
          onChange={(e) => onUpdate({ wallpaperDim: parseInt(e.target.value) })}
        />
      </SettingItem>
    </div>

    <div className="settings-page-section">
      <h2>{t.settings.widgets}</h2>
      <SettingItem label={t.settings.clock} description={t.settings.clockDesc}>
        <Toggle checked={settings.showClock} onChange={(v) => onUpdate({ showClock: v })} />
      </SettingItem>

      {settings.showClock && (
        <SettingItem label={t.settings.timeFormat} description={t.settings.timeFormatDesc}>
          <Select
            value={settings.clockFormat}
            options={[
              { value: '24h', label: t.settings.format24h },
              { value: '12h', label: t.settings.format12h },
            ]}
            onChange={(v) => onUpdate({ clockFormat: v as typeof settings.clockFormat })}
          />
        </SettingItem>
      )}

      <SettingItem label={t.settings.weather} description={t.settings.weatherDesc}>
        <Toggle checked={settings.showWeather} onChange={(v) => onUpdate({ showWeather: v })} />
      </SettingItem>

      <SettingItem label={t.settings.searchWidget} description={t.settings.searchWidgetDesc}>
        <Toggle checked={settings.showSearchOnStartPage} onChange={(v) => onUpdate({ showSearchOnStartPage: v })} />
      </SettingItem>

      <SettingItem label={t.settings.quickSitesWidget} description={t.settings.quickSitesWidgetDesc}>
        <Toggle checked={settings.showQuickSitesOnStartPage} onChange={(v) => onUpdate({ showQuickSitesOnStartPage: v })} />
      </SettingItem>

      {settings.showQuickSitesOnStartPage && (
        <SettingItem label={t.settings.quickSitesView} description={t.settings.quickSitesViewDesc}>
          <Select
            value={settings.quickSitesLayout}
            options={[
              { value: 'grid', label: t.settings.viewGrid },
              { value: 'list', label: t.settings.viewList },
              { value: 'compact', label: t.settings.viewCompact },
            ]}
            onChange={(v) => onUpdate({ quickSitesLayout: v as typeof settings.quickSitesLayout })}
          />
        </SettingItem>
      )}
    </div>
  </>
);
