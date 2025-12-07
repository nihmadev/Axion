// Axion Password Autofill Script
// Detects login forms and communicates with the browser for autofill

(function() {
    // Avoid re-initialization
    if (window.__AXION_AUTOFILL_INITIALIZED__) return 'already_initialized';
    window.__AXION_AUTOFILL_INITIALIZED__ = true;

    // Common selectors for login forms
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
    let autofillIcon = null;
    let pendingCredentials = null;

    // Find username field near password field
    function findUsernameField(passwordField) {
        const form = passwordField.closest('form');
        const container = form || passwordField.parentElement?.parentElement?.parentElement || document.body;
        
        for (const selector of USERNAME_SELECTORS) {
            const fields = container.querySelectorAll(selector);
            for (const field of fields) {
                if (field !== passwordField && isVisible(field)) {
                    return field;
                }
            }
        }
        
        // Fallback: find any text input before password field
        const allInputs = container.querySelectorAll('input[type="text"], input[type="email"]');
        for (const input of allInputs) {
            if (isVisible(input) && input.compareDocumentPosition(passwordField) & Node.DOCUMENT_POSITION_FOLLOWING) {
                return input;
            }
        }
        
        return null;
    }

    // Check if element is visible
    function isVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               el.offsetParent !== null;
    }

    // Create autofill icon
    function createAutofillIcon() {
        if (autofillIcon) return autofillIcon;
        
        const icon = document.createElement('div');
        icon.id = '__axion_autofill_icon__';
        icon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
        `;
        icon.style.cssText = `
            position: absolute;
            width: 24px;
            height: 24px;
            cursor: pointer;
            z-index: 999999;
            background: #7c3aed;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: transform 0.15s, background 0.15s;
        `;
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.1)';
            icon.style.background = '#6d28d9';
        });
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1)';
            icon.style.background = '#7c3aed';
        });
        
        document.body.appendChild(icon);
        autofillIcon = icon;
        return icon;
    }

    // Position icon next to input field
    function positionIcon(icon, inputField) {
        const rect = inputField.getBoundingClientRect();
        icon.style.top = `${window.scrollY + rect.top + (rect.height - 24) / 2}px`;
        icon.style.left = `${window.scrollX + rect.right - 28}px`;
    }

    // Send message to Rust via title IPC
    function sendToRust(type, data) {
        const message = JSON.stringify({ type, data });
        const originalTitle = document.title;
        document.title = '__AXION_AUTOFILL__:' + message;
        setTimeout(() => {
            document.title = originalTitle;
        }, 50);
    }

    // Detect login forms
    function detectLoginForms() {
        const passwordFields = document.querySelectorAll(PASSWORD_SELECTORS.join(', '));
        
        // Group password fields by form
        const formPasswordFields = new Map();
        for (const passwordField of passwordFields) {
            if (!isVisible(passwordField)) continue;
            const form = passwordField.closest('form') || document.body;
            if (!formPasswordFields.has(form)) {
                formPasswordFields.set(form, []);
            }
            formPasswordFields.get(form).push(passwordField);
        }
        
        // Process each form - use first password field (not confirm password)
        for (const [form, fields] of formPasswordFields) {
            const passwordField = fields[0]; // First password field
            
            const usernameField = findUsernameField(passwordField);
            if (!usernameField) continue;
            
            // Found a login form
            const formData = {
                url: window.location.href,
                hasUsername: !!usernameField,
                hasPassword: true,
            };
            
            // Store reference for autofill
            lastDetectedForm = {
                usernameField,
                passwordField,
            };
            
            // Create and position autofill icon
            const icon = createAutofillIcon();
            positionIcon(icon, passwordField);
            icon.style.display = 'flex';
            
            icon.onclick = () => {
                sendToRust('request_autofill', { url: window.location.href });
            };
            
            // Notify Rust about detected form
            sendToRust('form_detected', formData);
            
            // Only handle first visible form
            return;
        }
        
        // No form found, hide icon
        if (autofillIcon) {
            autofillIcon.style.display = 'none';
        }
    }

    // Fill credentials
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
        
        // Hide icon after fill
        if (autofillIcon) {
            autofillIcon.style.display = 'none';
        }
        
        return true;
    };

    // Capture credentials before form submission
    function captureCredentials(form) {
        const passwordFields = form.querySelectorAll('input[type="password"]');
        const passwordField = passwordFields[0]; // First password field (not confirm)
        if (!passwordField || !passwordField.value) return null;
        
        const usernameField = findUsernameField(passwordField);
        if (!usernameField || !usernameField.value) return null;
        
        return {
            url: window.location.href,
            username: usernameField.value,
            password: passwordField.value,
        };
    }

    // Detect form submission for save password prompt
    function setupFormSubmitDetection() {
        // Capture credentials on submit event (capture phase - runs first)
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (!(form instanceof HTMLFormElement)) return;
            
            const credentials = captureCredentials(form);
            if (credentials) {
                pendingCredentials = credentials;
                // Send immediately in case preventDefault is called
                sendToRust('credentials_submitted', credentials);
            }
        }, true);
        
        // Also detect click on submit buttons (for SPA and forms with preventDefault)
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
                // Delay slightly to allow form validation, but send before potential navigation
                setTimeout(() => {
                    if (pendingCredentials) {
                        sendToRust('credentials_submitted', pendingCredentials);
                        pendingCredentials = null;
                    }
                }, 50);
            }
        }, true);

        // Monitor password field changes to capture credentials on blur
        document.addEventListener('blur', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLInputElement)) return;
            if (target.type !== 'password' || !target.value) return;
            
            const form = target.closest('form');
            if (!form) return;
            
            const credentials = captureCredentials(form);
            if (credentials) {
                pendingCredentials = credentials;
            }
        }, true);

        // Send pending credentials on beforeunload (page navigation)
        window.addEventListener('beforeunload', () => {
            if (pendingCredentials) {
                sendToRust('credentials_submitted', pendingCredentials);
            }
        });
    }

    // Update icon position on scroll/resize
    function updateIconPosition() {
        if (!autofillIcon || autofillIcon.style.display === 'none') return;
        if (!lastDetectedForm?.passwordField) return;
        
        if (isVisible(lastDetectedForm.passwordField)) {
            positionIcon(autofillIcon, lastDetectedForm.passwordField);
        } else {
            autofillIcon.style.display = 'none';
        }
    }

    // Initialize
    function init() {
        detectLoginForms();
        setupFormSubmitDetection();
        
        // Re-detect on DOM changes
        const observer = new MutationObserver(() => {
            setTimeout(detectLoginForms, 100);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Update icon position
        window.addEventListener('scroll', updateIconPosition);
        window.addEventListener('resize', updateIconPosition);
        
        // Periodic check for SPA
        setInterval(detectLoginForms, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return 'initialized';
})();
