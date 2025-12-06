import React, { useState } from 'react';
import { Settings } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { SettingsTab, TabConfig } from './types';
import {
  AppearanceSettings,
  SidebarSettings,
  TabsSettings,
  StartPageSettings,
  PrivacySettings,
  PerformanceSettings,
  AdvancedSettings,
} from './tabs';
import '../../styles/components/settings/index.css';

interface SettingsPageProps {
  settings: Settings;
  onUpdate: (settings: Partial<Settings>) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const t = useTranslation(settings.language);

  const tabs: TabConfig[] = [
    {
      id: 'appearance',
      label: t.settings.tabs.appearance,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ),
    },
    {
      id: 'sidebar',
      label: t.settings.tabs.sidebar,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 3v18"/>
        </svg>
      ),
    },
    {
      id: 'tabs',
      label: t.settings.tabs.tabs,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <path d="M2 8h20"/>
          <path d="M8 4v4"/>
        </svg>
      ),
    },
    {
      id: 'startpage',
      label: t.settings.tabs.startpage,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      id: 'privacy',
      label: t.settings.tabs.privacy,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
    },
    {
      id: 'performance',
      label: t.settings.tabs.performance,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      ),
    },
    {
      id: 'advanced',
      label: t.settings.tabs.advanced,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
  ];


  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <h1>{t.settings.title}</h1>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="settings-page-content">
          {activeTab === 'appearance' && (
            <AppearanceSettings settings={settings} onUpdate={onUpdate} t={t} />
          )}
          {activeTab === 'sidebar' && (
            <SidebarSettings settings={settings} onUpdate={onUpdate} t={t} />
          )}
          {activeTab === 'tabs' && (
            <TabsSettings settings={settings} onUpdate={onUpdate} t={t} />
          )}
          {activeTab === 'startpage' && (
            <StartPageSettings settings={settings} onUpdate={onUpdate} t={t} />
          )}
          {activeTab === 'privacy' && (
            <PrivacySettings settings={settings} onUpdate={onUpdate} t={t} />
          )}
          {activeTab === 'performance' && (
            <PerformanceSettings settings={settings} onUpdate={onUpdate} t={t} />
          )}
          {activeTab === 'advanced' && (
            <AdvancedSettings settings={settings} onUpdate={onUpdate} t={t} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
