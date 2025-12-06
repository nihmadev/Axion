import React from 'react';
import { SettingsTabProps } from '../types';
import { Toggle, Select, SettingItem } from '../SettingsComponents';

export const TabsSettings: React.FC<SettingsTabProps> = ({ settings, onUpdate, t }) => (
  <>
    <div className="settings-page-section">
      <h2>{t.settings.tabsAppearance}</h2>
      <SettingItem label={t.settings.tabStyle} description={t.settings.tabStyleDesc}>
        <div className="tab-style-selector">
          {(['default', 'compact', 'pills'] as const).map((style) => (
            <button
              key={style}
              className={`tab-style-option ${settings.tabStyle === style ? 'active' : ''}`}
              onClick={() => onUpdate({ tabStyle: style })}
            >
              <div className={`tab-style-preview ${style}`}>
                <div className="tab-preview-item" />
                <div className="tab-preview-item active" />
                <div className="tab-preview-item" />
              </div>
              <span>{style === 'default' ? t.settings.tabStyleDefault : style === 'compact' ? t.settings.tabStyleCompact : t.settings.tabStylePills}</span>
            </button>
          ))}
        </div>
      </SettingItem>

      <SettingItem label={t.settings.showIcons} description={t.settings.showIconsDesc}>
        <Toggle checked={settings.showTabFavicons} onChange={(v) => onUpdate({ showTabFavicons: v })} />
      </SettingItem>

      <SettingItem label={t.settings.closeButton} description={t.settings.closeButtonDesc}>
        <Select
          value={settings.tabCloseButton}
          options={[
            { value: 'hover', label: t.settings.closeOnHover },
            { value: 'always', label: t.settings.closeAlways },
            { value: 'never', label: t.settings.closeNever },
          ]}
          onChange={(v) => onUpdate({ tabCloseButton: v as typeof settings.tabCloseButton })}
        />
      </SettingItem>

      <SettingItem label={t.settings.tabPreviews} description={t.settings.tabPreviewsDesc}>
        <Toggle checked={settings.showTabPreviews} onChange={(v) => onUpdate({ showTabPreviews: v })} />
      </SettingItem>
    </div>
  </>
);
