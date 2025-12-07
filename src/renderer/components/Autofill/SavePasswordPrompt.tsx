import React, { useState, useEffect } from 'react';
import { electronAPI } from '../../tauri-api';
import './Autofill.css';

interface SavePasswordPromptProps {
  url: string;
  username: string;
  password: string;
  onClose: () => void;
  onSaved?: () => void;
  t: any;
}

export const SavePasswordPrompt: React.FC<SavePasswordPromptProps> = ({
  url,
  username,
  password,
  onClose,
  onSaved,
  t,
}) => {
  const [saving, setSaving] = useState(false);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [noVault, setNoVault] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkVaultState();
  }, []);

  const checkVaultState = async () => {
    try {
      const exists = await electronAPI.vaultExists();
      if (!exists) {
        setNoVault(true);
        return;
      }
      const unlocked = await electronAPI.isVaultUnlocked();
      setVaultLocked(!unlocked);
    } catch (err) {
      console.error('Failed to check vault state:', err);
    }
  };

  const handleUnlock = async () => {
    setError('');
    try {
      await electronAPI.unlockVault(masterPassword);
      setVaultLocked(false);
      setMasterPassword('');
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    try {
      // Extract domain from URL
      let domain = url;
      try {
        const urlObj = new URL(url);
        domain = urlObj.hostname;
      } catch {}
      
      await electronAPI.addPassword(domain, username, password);
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setSaving(false);
    }
  };

  // Auto-close after 15 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 15000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (noVault) {
    return null; // Don't show prompt if no vault exists
  }

  return (
    <div className="save-password-prompt">
      <div className="save-password-content">
        <div className="save-password-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        
        <div className="save-password-info">
          <div className="save-password-title">
            {t?.autofill?.savePassword || 'Save password?'}
          </div>
          <div className="save-password-details">
            <span className="save-password-username">{username}</span>
            <span className="save-password-url">{url}</span>
          </div>
        </div>

        {vaultLocked ? (
          <div className="save-password-unlock">
            {error && <div className="autofill-error">{error}</div>}
            <input
              type="password"
              className="autofill-input"
              placeholder={t?.passwords?.masterPassword || 'Master password'}
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />
            <button className="autofill-btn primary" onClick={handleUnlock}>
              {t?.passwords?.unlock || 'Unlock'}
            </button>
          </div>
        ) : (
          <div className="save-password-actions">
            {error && <div className="autofill-error">{error}</div>}
            <button 
              className="autofill-btn" 
              onClick={onClose}
              disabled={saving}
            >
              {t?.autofill?.notNow || 'Not now'}
            </button>
            <button 
              className="autofill-btn primary" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '...' : (t?.autofill?.save || 'Save')}
            </button>
          </div>
        )}

        <button className="save-password-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SavePasswordPrompt;
