import React, { useState, useEffect, useCallback } from 'react';
import { electronAPI } from '../../tauri-api';
import './Autofill.css';

interface PasswordEntry {
  id: string;
  url: string;
  username: string;
  password: string;
}

interface AutofillPopupProps {
  url: string;
  tabId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onFill: (tabId: string, username: string, password: string) => void;
  t: any;
}

export const AutofillPopup: React.FC<AutofillPopupProps> = ({
  url,
  tabId,
  position,
  onClose,
  onFill,
  t,
}) => {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPasswords();
  }, [url]);

  const loadPasswords = async () => {
    setLoading(true);
    setError('');
    
    try {
      const unlocked = await electronAPI.isVaultUnlocked();
      if (!unlocked) {
        const exists = await electronAPI.vaultExists();
        if (!exists) {
          setLoading(false);
          return;
        }
        setVaultLocked(true);
        setLoading(false);
        return;
      }

      const data = await electronAPI.getPasswordsForUrl(url);
      setPasswords(data || []);
    } catch (err) {
      console.error('Failed to load passwords:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    setError('');
    try {
      await electronAPI.unlockVault(masterPassword);
      setVaultLocked(false);
      setMasterPassword('');
      loadPasswords();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleSelect = useCallback((entry: PasswordEntry) => {
    onFill(tabId, entry.username, entry.password);
    onClose();
  }, [tabId, onFill, onClose]);

  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.autofill-popup')) {
        onClose();
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    zIndex: 999999,
  };

  if (loading) {
    return (
      <div className="autofill-popup" style={popupStyle}>
        <div className="autofill-loading">
          <div className="spinner-small" />
        </div>
      </div>
    );
  }

  if (vaultLocked) {
    return (
      <div className="autofill-popup" style={popupStyle}>
        <div className="autofill-unlock">
          <div className="autofill-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p>{t?.passwords?.unlockDesc || 'Enter master password'}</p>
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
      </div>
    );
  }

  if (passwords.length === 0) {
    return (
      <div className="autofill-popup" style={popupStyle}>
        <div className="autofill-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
          <p>{t?.passwords?.noPasswords || 'No saved passwords'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="autofill-popup" style={popupStyle}>
      <div className="autofill-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>{t?.passwords?.password || 'Passwords'}</span>
      </div>
      <div className="autofill-list">
        {passwords.map((entry) => (
          <div
            key={entry.id}
            className="autofill-item"
            onClick={() => handleSelect(entry)}
          >
            <div className="autofill-item-icon">
              <img
                src={`https://${new URL(entry.url).hostname}/favicon.ico`}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="autofill-item-info">
              <div className="autofill-item-username">{entry.username}</div>
              <div className="autofill-item-url">{entry.url}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutofillPopup;
