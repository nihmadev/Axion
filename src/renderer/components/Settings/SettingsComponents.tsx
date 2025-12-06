import React from 'react';

// Компонент Toggle
export const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
  <button
    className={`settings-toggle ${checked ? 'active' : ''}`}
    onClick={() => onChange(!checked)}
  >
    <span className="settings-toggle-knob" />
  </button>
);

// Компонент Select
export const Select: React.FC<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// Компонент SettingItem
export const SettingItem: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
  vertical?: boolean;
}> = ({ label, description, children, vertical }) => (
  <div className={`settings-page-item ${vertical ? 'vertical' : ''}`}>
    <div className="settings-page-item-info">
      <label>{label}</label>
      {description && <span>{description}</span>}
    </div>
    {children}
  </div>
);
