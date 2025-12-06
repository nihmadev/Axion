import React from 'react';
import { SettingsTabProps } from '../types';
import { Toggle, Select, SettingItem } from '../SettingsComponents';

export const SidebarSettings: React.FC<SettingsTabProps> = ({ settings, onUpdate, t }) => (
  <>
    <div className="settings-page-section">
      <h2>{t.settings.position}</h2>
      <SettingItem label={t.settings.sidebarPosition} description={t.settings.sidebarPositionDesc}>
        <div className="position-selector">
          <button
            className={`position-option ${settings.sidebarPosition === 'left' ? 'active' : ''}`}
            onClick={() => onUpdate({ sidebarPosition: 'left' })}
          >
            <div className="position-preview">
              <div className="position-sidebar left" />
              <div className="position-content" />
            </div>
            <span>{t.settings.positionLeft}</span>
          </button>
          <button
            className={`position-option ${settings.sidebarPosition === 'right' ? 'active' : ''}`}
            onClick={() => onUpdate({ sidebarPosition: 'right' })}
          >
            <div className="position-preview">
              <div className="position-content" />
              <div className="position-sidebar right" />
            </div>
            <span>{t.settings.positionRight}</span>
          </button>
        </div>
      </SettingItem>

      <SettingItem label={t.settings.sidebarStyle} description={t.settings.sidebarStyleDesc}>
        <Select
          value={settings.sidebarStyle}
          options={[
            { value: 'default', label: t.settings.styleDefault },
            { value: 'compact', label: t.settings.styleCompact },
            { value: 'minimal', label: t.settings.styleMinimal },
          ]}
          onChange={(v) => onUpdate({ sidebarStyle: v as typeof settings.sidebarStyle })}
        />
      </SettingItem>

      <SettingItem label={t.settings.autoHide} description={t.settings.autoHideDesc}>
        <Toggle checked={settings.sidebarAutoHide} onChange={(v) => onUpdate({ sidebarAutoHide: v })} />
      </SettingItem>
    </div>

    <div className="settings-page-section">
      <h2>{t.settings.sidebarElements}</h2>
      <SettingItem label={t.settings.quickSites} description={t.settings.quickSitesDesc}>
        <Toggle checked={settings.showSidebarQuickSites} onChange={(v) => onUpdate({ showSidebarQuickSites: v })} />
      </SettingItem>

      <SettingItem label={t.settings.workspaces} description={t.settings.workspacesDesc}>
        <Toggle checked={settings.showSidebarWorkspaces} onChange={(v) => onUpdate({ showSidebarWorkspaces: v })} />
      </SettingItem>

      <SettingItem label={t.settings.navigation} description={t.settings.navigationDesc}>
        <Toggle checked={settings.showSidebarNavigation} onChange={(v) => onUpdate({ showSidebarNavigation: v })} />
      </SettingItem>
    </div>
  </>
);
