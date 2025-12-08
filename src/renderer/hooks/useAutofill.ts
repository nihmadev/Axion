import { useState, useEffect, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

interface AutofillRequest {
  tabId: string;
  url: string;
  position: { x: number; y: number };
}

interface SavePasswordRequest {
  tabId: string;
  url: string;
  username: string;
  password: string;
}

interface UseAutofillProps {
  activeTabId: string;
}

export function useAutofill({ activeTabId }: UseAutofillProps) {
  const [autofillRequest, setAutofillRequest] = useState<AutofillRequest | null>(null);
  const [savePasswordRequest, setSavePasswordRequest] = useState<SavePasswordRequest | null>(null);
  const injectedTabs = useRef<Set<string>>(new Set());
  const savedCredentials = useRef<Map<string, { username: string; password: string }>>(new Map());

  
  const injectAutofillScript = useCallback(async (tabId: string) => {
    if (injectedTabs.current.has(tabId)) return;
    
    try {
      
      
      await invoke('execute_script', { 
        id: tabId, 
        script: getInlineAutofillScript() 
      });
      
      injectedTabs.current.add(tabId);
    } catch (err) {
      console.error('Failed to inject autofill script:', err);
    }
  }, []);

  
  const fillCredentials = useCallback(async (tabId: string, username: string, password: string) => {
    try {
      const script = `
        if (window.__axionFillCredentials__) {
          window.__axionFillCredentials__(${JSON.stringify(username)}, ${JSON.stringify(password)});
        }
      `;
      await invoke('execute_script', { id: tabId, script });
    } catch (err) {
      console.error('Failed to fill credentials:', err);
    }
  }, []);

  
  useEffect(() => {
    const handleAutofillMessage = (event: any) => {
      const { id, message: jsonStr } = event.payload || {};
      if (!jsonStr || !id) return;
      
      try {
        const message = JSON.parse(jsonStr);
        
        if (message.type === 'request_autofill') {
          
          setAutofillRequest({
            tabId: id,
            url: message.data.url,
            position: { x: window.innerWidth / 2 - 140, y: 100 },
          });
        } else if (message.type === 'credentials_submitted') {
          
          const key = `${message.data.url}:${message.data.username}`;
          const existing = savedCredentials.current.get(key);
          if (existing && existing.password === message.data.password) {
            return; 
          }
          
          
          setSavePasswordRequest({
            tabId: id,
            url: message.data.url,
            username: message.data.username,
            password: message.data.password,
          });
        } else if (message.type === 'form_detected') {
          
          injectAutofillScript(id);
        }
      } catch (err) {
        
      }
    };

    const unlisten = listen('autofill-message', handleAutofillMessage);
    
    return () => {
      unlisten.then(fn => fn());
    };
  }, [injectAutofillScript]);

  
  useEffect(() => {
    if (activeTabId) {
      
      const timer = setTimeout(() => {
        injectAutofillScript(activeTabId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTabId, injectAutofillScript]);

  
  const closeAutofillPopup = useCallback(() => {
    setAutofillRequest(null);
  }, []);

  
  const closeSavePasswordPrompt = useCallback(() => {
    setSavePasswordRequest(null);
  }, []);

  
  const markCredentialsSaved = useCallback(() => {
    if (savePasswordRequest) {
      const key = `${savePasswordRequest.url}:${savePasswordRequest.username}`;
      savedCredentials.current.set(key, {
        username: savePasswordRequest.username,
        password: savePasswordRequest.password,
      });
    }
    setSavePasswordRequest(null);
  }, [savePasswordRequest]);

  
  const clearTabCache = useCallback((tabId: string) => {
    injectedTabs.current.delete(tabId);
  }, []);

  return {
    autofillRequest,
    savePasswordRequest,
    fillCredentials,
    closeAutofillPopup,
    closeSavePasswordPrompt,
    markCredentialsSaved,
    clearTabCache,
    injectAutofillScript,
  };
}


function getInlineAutofillScript(): string {
  return `
(function() {
    if (window.__AXION_AUTOFILL_INITIALIZED__) return;
    window.__AXION_AUTOFILL_INITIALIZED__ = true;

    const USERNAME_SELECTORS = [
        'input[type="email"]',
        'input[type="text"][name*="user"]',
        'input[type="text"][name*="login"]',
        'input[type="text"][name*="email"]',
        'input[type="text"][id*="user"]',
        'input[type="text"][id*="login"]',
        'input[type="text"][id*="email"]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]',
        'input[name="username"]',
        'input[name="email"]',
        'input[name="login"]',
        'input[name="identifier"]',
        'input[id="username"]',
        'input[id="email"]',
        'input[id="login"]',
    ];

    const PASSWORD_SELECTORS = [
        'input[type="password"]',
        'input[autocomplete="current-password"]',
        'input[autocomplete="new-password"]',
    ];

    let lastDetectedForm = null;
    let pendingCredentials = null;

    function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && el.offsetParent !== null;
    }

    function findUsernameField(passwordField) {
        const form = passwordField.closest('form');
        const container = form || passwordField.parentElement?.parentElement?.parentElement || document.body;
        for (const selector of USERNAME_SELECTORS) {
            const fields = container.querySelectorAll(selector);
            for (const field of fields) {
                if (field !== passwordField && isVisible(field)) return field;
            }
        }
        const allInputs = container.querySelectorAll('input[type="text"], input[type="email"]');
        for (const input of allInputs) {
            if (isVisible(input) && input.compareDocumentPosition(passwordField) & Node.DOCUMENT_POSITION_FOLLOWING) {
                return input;
            }
        }
        return null;
    }

    function sendToRust(type, data) {
        const message = JSON.stringify({ type, data });
        const originalTitle = document.title;
        document.title = '__AXION_AUTOFILL__:' + message;
        setTimeout(() => { document.title = originalTitle; }, 50);
    }

    function detectLoginForms() {
        const passwordFields = document.querySelectorAll(PASSWORD_SELECTORS.join(', '));
        const formPasswordFields = new Map();
        for (const passwordField of passwordFields) {
            if (!isVisible(passwordField)) continue;
            const form = passwordField.closest('form') || document.body;
            if (!formPasswordFields.has(form)) formPasswordFields.set(form, []);
            formPasswordFields.get(form).push(passwordField);
        }
        for (const [form, fields] of formPasswordFields) {
            const passwordField = fields[0];
            const usernameField = findUsernameField(passwordField);
            if (!usernameField) continue;
            lastDetectedForm = { usernameField, passwordField };
            sendToRust('form_detected', { url: window.location.href });
            return;
        }
    }

    window.__axionFillCredentials__ = function(username, password) {
        if (!lastDetectedForm) return false;
        const { usernameField, passwordField } = lastDetectedForm;
        if (usernameField && username) {
            usernameField.focus();
            usernameField.value = username;
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            usernameField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (passwordField && password) {
            passwordField.focus();
            passwordField.value = password;
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
    };

    function captureCredentials(form) {
        const passwordFields = form.querySelectorAll('input[type="password"]');
        const passwordField = passwordFields[0]; 
        if (!passwordField || !passwordField.value) return null;
        const usernameField = findUsernameField(passwordField);
        if (!usernameField || !usernameField.value) return null;
        return { url: window.location.href, username: usernameField.value, password: passwordField.value };
    }

    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (!(form instanceof HTMLFormElement)) return;
        const credentials = captureCredentials(form);
        if (credentials) {
            pendingCredentials = credentials;
            sendToRust('credentials_submitted', credentials);
        }
    }, true);

    document.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const button = target.closest('button[type="submit"], input[type="submit"], button:not([type])');
        if (!button) return;
        const form = button.closest('form');
        if (!form) return;
        const credentials = captureCredentials(form);
        if (credentials) {
            pendingCredentials = credentials;
            setTimeout(() => {
                if (pendingCredentials) {
                    sendToRust('credentials_submitted', pendingCredentials);
                    pendingCredentials = null;
                }
            }, 50);
        }
    }, true);

    window.addEventListener('beforeunload', () => {
        if (pendingCredentials) sendToRust('credentials_submitted', pendingCredentials);
    });

    detectLoginForms();
    const observer = new MutationObserver(() => setTimeout(detectLoginForms, 100));
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(detectLoginForms, 2000);
})();
  `;
}

export default useAutofill;
