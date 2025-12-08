import React, { useState, useEffect } from 'react';
import { SettingsTabProps } from '../types';
import { electronAPI } from '../../../tauri-api';

interface PasswordEntry {
  id: string;
  url: string;
  username: string;
  password: string;
  createdAt: number;
  updatedAt: number;
}

type VaultState = 'loading' | 'no-vault' | 'locked' | 'unlocked';

export const PasswordsSettings: React.FC<SettingsTabProps> = ({ t }) => {
  const [vaultState, setVaultState] = useState<VaultState>('loading');
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  
  const [newUrl, setNewUrl] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedLength, setGeneratedLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  
  const [oldMasterPassword, setOldMasterPassword] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmNewMasterPassword, setConfirmNewMasterPassword] = useState('');

  
  useEffect(() => {
    checkVaultState();
  }, []);

  const checkVaultState = async () => {
    try {
      const exists = await electronAPI.vaultExists();
      if (!exists) {
        setVaultState('no-vault');
        return;
      }
      const unlocked = await electronAPI.isVaultUnlocked();
      setVaultState(unlocked ? 'unlocked' : 'locked');
      if (unlocked) {
        loadPasswords();
      }
    } catch (err) {
      console.error('Failed to check vault state:', err);
      setError('Failed to check vault state');
    }
  };

  const loadPasswords = async () => {
    try {
      const data = await electronAPI.getPasswords();
      setPasswords(data || []);
    } catch (err) {
      console.error('Failed to load passwords:', err);
      setError('Failed to load passwords');
    }
  };

  const handleCreateVault = async () => {
    setError('');
    if (masterPassword.length < 8) {
      setError(t.passwords?.minLength || 'Password must be at least 8 characters');
      return;
    }
    if (masterPassword !== confirmPassword) {
      setError(t.passwords?.noMatch || 'Passwords do not match');
      return;
    }
    try {
      await electronAPI.createVault(masterPassword);
      setMasterPassword('');
      setConfirmPassword('');
      setVaultState('unlocked');
      loadPasswords();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleUnlock = async () => {
    setError('');
    try {
      await electronAPI.unlockVault(masterPassword);
      setMasterPassword('');
      setVaultState('unlocked');
      loadPasswords();
    } catch (err: any) {
      const errorMessage = err.toString();
      
      if (errorMessage.includes('deleted')) {
        setVaultState('no-vault');
        setError(t.passwords?.vaultDeleted || 'Vault has been deleted due to too many failed attempts.');
      } else {
        setError(errorMessage);
      }
      setMasterPassword('');
    }
  };

  const handleLock = async () => {
    try {
      await electronAPI.lockVault();
      setPasswords([]);
      setVaultState('locked');
      setVisiblePasswords(new Set());
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleAddPassword = async () => {
    if (!newUrl || !newUsername || !newPassword) {
      setError(t.passwords?.fillAll || 'Please fill all fields');
      return;
    }
    try {
      await electronAPI.addPassword(newUrl, newUsername, newPassword);
      setShowAddModal(false);
      resetForm();
      loadPasswords();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleUpdatePassword = async () => {
    if (!editingPassword) return;
    try {
      await electronAPI.updatePassword(
        editingPassword.id,
        newUrl || undefined,
        newUsername || undefined,
        newPassword || undefined
      );
      setEditingPassword(null);
      resetForm();
      loadPasswords();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleDeletePassword = async (id: string) => {
    try {
      await electronAPI.deletePassword(id);
      loadPasswords();
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const generated = await electronAPI.generatePassword(generatedLength, includeSymbols);
      setNewPassword(generated);
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const handleChangeMasterPassword = async () => {
    setError('');
    if (newMasterPassword.length < 8) {
      setError(t.passwords?.minLength || 'Password must be at least 8 characters');
      return;
    }
    if (newMasterPassword !== confirmNewMasterPassword) {
      setError(t.passwords?.noMatch || 'Passwords do not match');
      return;
    }
    try {
      await electronAPI.changeMasterPassword(oldMasterPassword, newMasterPassword);
      setShowChangePassword(false);
      setOldMasterPassword('');
      setNewMasterPassword('');
      setConfirmNewMasterPassword('');
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const resetForm = () => {
    setNewUrl('');
    setNewUsername('');
    setNewPassword('');
    setError('');
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredPasswords = searchQuery
    ? passwords.filter(p => 
        p.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : passwords;

  const startEdit = (password: PasswordEntry) => {
    setEditingPassword(password);
    setNewUrl(password.url);
    setNewUsername(password.username);
    setNewPassword('');
  };

  
  if (vaultState === 'loading') {
    return (
      <div className="passwords-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (vaultState === 'no-vault') {
    return (
      <div className="passwords-setup">
        <div className="passwords-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2>{t.passwords?.setupTitle || 'Set Up Password Manager'}</h2>
        <p className="passwords-description">
          {t.passwords?.setupDesc || 'Create a master password to encrypt and protect your saved passwords. This password cannot be recovered if lost.'}
        </p>
        
        {error && <div className="passwords-error">{error}</div>}
        
        <div className="passwords-form">
          <input
            type="password"
            className="passwords-input"
            placeholder={t.passwords?.masterPassword || 'Master password'}
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
          />
          <input
            type="password"
            className="passwords-input"
            placeholder={t.passwords?.confirmPassword || 'Confirm password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button className="passwords-btn primary" onClick={handleCreateVault}>
            {t.passwords?.createVault || 'Create Vault'}
          </button>
        </div>
      </div>
    );
  }

  if (vaultState === 'locked') {
    return (
      <div className="passwords-unlock">
        <div className="passwords-icon locked">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2>{t.passwords?.unlockTitle || 'Unlock Password Vault'}</h2>
        <p className="passwords-description">
          {t.passwords?.unlockDesc || 'Enter your master password to access saved passwords.'}
        </p>
        
        {error && <div className="passwords-error">{error}</div>}
        
        <div className="passwords-form">
          <input
            type="password"
            className="passwords-input"
            placeholder={t.passwords?.masterPassword || 'Master password'}
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          />
          <button className="passwords-btn primary" onClick={handleUnlock}>
            {t.passwords?.unlock || 'Unlock'}
          </button>
        </div>
      </div>
    );
  }

  
  return (
    <div className="passwords-manager">
      <div className="passwords-header">
        <div className="passwords-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder={t.passwords?.search || 'Search passwords...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="passwords-actions">
          <button className="passwords-btn" onClick={() => setShowAddModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {t.passwords?.add || 'Add'}
          </button>
          <button className="passwords-btn" onClick={() => setShowChangePassword(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </button>
          <button className="passwords-btn danger" onClick={handleLock}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            {t.passwords?.lock || 'Lock'}
          </button>
        </div>
      </div>

      {error && <div className="passwords-error">{error}</div>}

      <div className="passwords-list">
        {filteredPasswords.length === 0 ? (
          <div className="passwords-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
            </svg>
            <p>{t.passwords?.noPasswords || 'No saved passwords'}</p>
          </div>
        ) : (
          filteredPasswords.map((password) => (
            <div key={password.id} className="password-item">
              <div className="password-item-icon">
                <img 
                  src={`https://${new URL(password.url).hostname}/favicon.ico`}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="password-item-info">
                <div className="password-item-url">{password.url}</div>
                <div className="password-item-username">{password.username}</div>
                <div className="password-item-password">
                  {visiblePasswords.has(password.id) ? password.password : '��������'}
                </div>
              </div>
              <div className="password-item-actions">
                <button 
                  className="password-action-btn"
                  onClick={() => togglePasswordVisibility(password.id)}
                  title={visiblePasswords.has(password.id) ? 'Hide' : 'Show'}
                >
                  {visiblePasswords.has(password.id) ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
                <button 
                  className="password-action-btn"
                  onClick={() => copyToClipboard(password.username)}
                  title="Copy username"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  </svg>
                </button>
                <button 
                  className="password-action-btn"
                  onClick={() => copyToClipboard(password.password)}
                  title="Copy password"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
                <button 
                  className="password-action-btn"
                  onClick={() => startEdit(password)}
                  title="Edit"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button 
                  className="password-action-btn danger"
                  onClick={() => handleDeletePassword(password.id)}
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {}
      {(showAddModal || editingPassword) && (
        <div className="passwords-modal-overlay" onClick={() => { setShowAddModal(false); setEditingPassword(null); resetForm(); }}>
          <div className="passwords-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingPassword ? (t.passwords?.editPassword || 'Edit Password') : (t.passwords?.addPassword || 'Add Password')}</h3>
            
            <div className="passwords-form">
              <label>{t.passwords?.website || 'Website'}</label>
              <input
                type="text"
                className="passwords-input"
                placeholder="example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              
              <label>{t.passwords?.username || 'Username'}</label>
              <input
                type="text"
                className="passwords-input"
                placeholder={t.passwords?.username || 'Username'}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
              
              <label>{t.passwords?.password || 'Password'}</label>
              <div className="password-input-group">
                <input
                  type="text"
                  className="passwords-input"
                  placeholder={editingPassword ? (t.passwords?.leaveEmpty || 'Leave empty to keep current') : (t.passwords?.password || 'Password')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button className="passwords-btn" onClick={handleGeneratePassword}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </button>
              </div>
              
              <div className="password-generator-options">
                <label>
                  {t.passwords?.length || 'Length'}: {generatedLength}
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={generatedLength}
                    onChange={(e) => setGeneratedLength(Number(e.target.value))}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                  />
                  {t.passwords?.includeSymbols || 'Include symbols'}
                </label>
              </div>
              
              <div className="passwords-modal-actions">
                <button className="passwords-btn" onClick={() => { setShowAddModal(false); setEditingPassword(null); resetForm(); }}>
                  {t.common?.cancel || 'Cancel'}
                </button>
                <button className="passwords-btn primary" onClick={editingPassword ? handleUpdatePassword : handleAddPassword}>
                  {editingPassword ? (t.passwords?.change || 'Save') : (t.passwords?.add || 'Add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {showChangePassword && (
        <div className="passwords-modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div className="passwords-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.passwords?.changeMaster || 'Change Master Password'}</h3>
            
            {error && <div className="passwords-error">{error}</div>}
            
            <div className="passwords-form">
              <label>{t.passwords?.currentPassword || 'Current password'}</label>
              <input
                type="password"
                className="passwords-input"
                value={oldMasterPassword}
                onChange={(e) => setOldMasterPassword(e.target.value)}
              />
              
              <label>{t.passwords?.newPassword || 'New password'}</label>
              <input
                type="password"
                className="passwords-input"
                value={newMasterPassword}
                onChange={(e) => setNewMasterPassword(e.target.value)}
              />
              
              <label>{t.passwords?.confirmNewPassword || 'Confirm new password'}</label>
              <input
                type="password"
                className="passwords-input"
                value={confirmNewMasterPassword}
                onChange={(e) => setConfirmNewMasterPassword(e.target.value)}
              />
              
              <div className="passwords-modal-actions">
                <button className="passwords-btn" onClick={() => setShowChangePassword(false)}>
                  {t.common?.cancel || 'Cancel'}
                </button>
                <button className="passwords-btn primary" onClick={handleChangeMasterPassword}>
                  {t.passwords?.change || 'Change'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
