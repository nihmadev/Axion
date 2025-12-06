import React from 'react';
import { SettingsTabProps } from '../types';
import { Toggle, Select, SettingItem } from '../SettingsComponents';

// DoH провайдеры с их URL
const DOH_PROVIDERS = {
  cloudflare: 'https://cloudflare-dns.com/dns-query',
  google: 'https://dns.google/dns-query',
  quad9: 'https://dns.quad9.net/dns-query',
  adguard: 'https://dns.adguard.com/dns-query',
  custom: '',
};

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
      <h2>{t.settings.dnsOverHttps}</h2>
      <SettingItem label={t.settings.dohEnabled} description={t.settings.dohEnabledDesc}>
        <Toggle checked={settings.dohEnabled} onChange={(v) => onUpdate({ dohEnabled: v })} />
      </SettingItem>

      {settings.dohEnabled && (
        <>
          <SettingItem label={t.settings.dohProvider} description={t.settings.dohProviderDesc}>
            <Select
              value={settings.dohProvider}
              options={[
                { value: 'cloudflare', label: t.settings.dohProviderCloudflare },
                { value: 'google', label: t.settings.dohProviderGoogle },
                { value: 'quad9', label: t.settings.dohProviderQuad9 },
                { value: 'adguard', label: t.settings.dohProviderAdguard },
                { value: 'custom', label: t.settings.dohProviderCustom },
              ]}
              onChange={(v) => onUpdate({ 
                dohProvider: v as typeof settings.dohProvider,
                // Автоматически устанавливаем URL для выбранного провайдера
                dohCustomUrl: v === 'custom' ? settings.dohCustomUrl : DOH_PROVIDERS[v as keyof typeof DOH_PROVIDERS]
              })}
            />
          </SettingItem>

          {settings.dohProvider === 'custom' && (
            <SettingItem label={t.settings.dohCustomUrl} description={t.settings.dohCustomUrlDesc} vertical>
              <input
                type="url"
                className="settings-input"
                value={settings.dohCustomUrl}
                onChange={(e) => onUpdate({ dohCustomUrl: e.target.value })}
                placeholder="https://dns.example.com/dns-query"
              />
            </SettingItem>
          )}

          {settings.dohProvider !== 'custom' && (
            <div className="doh-provider-info">
              <span className="doh-url-label">URL:</span>
              <code className="doh-url">{DOH_PROVIDERS[settings.dohProvider]}</code>
            </div>
          )}
        </>
      )}
    </div>

    <div className="settings-page-section">
      <h2>{t.settings.data}</h2>
      <SettingItem label={t.settings.clearOnExit} description={t.settings.clearOnExitDesc}>
        <Toggle checked={settings.clearDataOnExit} onChange={(v) => onUpdate({ clearDataOnExit: v })} />
      </SettingItem>
    </div>
  </>
);
