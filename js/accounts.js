// js/accounts.js
// ===================================================================
// ACCOUNT MANAGEMENT (Uses Backend Server)
// ===================================================================

(function () {
    'use strict';

    // Backend API URL - Smart detection for local development vs production
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '3001'
        ? (window.location.protocol + '//' + window.location.hostname + ':3001')
        : window.location.origin;

    console.log('🔗 API Base URL:', API_BASE);

    // Local session storage
    const SESSION_KEY = 'shqipai_session';
    const TOKEN_KEY = 'shqipai_session_token';

    // Current user state
    let currentUser = null;

    // ===================================================================
    // API HELPERS
    // ===================================================================

    function getSessionToken() {
        return sessionStorage.getItem(TOKEN_KEY);
    }

    async function apiCall(endpoint, options = {}) {
        const url = `${API_BASE}/api${endpoint}`;
        const token = getSessionToken();
        const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...authHeaders, ...options.headers },
            ...options
        });

        let data;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('API Error: Non-JSON response', text);
            throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }
        return data;
    }

    // ===================================================================
    // SESSION MANAGEMENT
    // ===================================================================

    function saveSession(user, sessionToken) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            user: user
        }));
        if (sessionToken) {
            sessionStorage.setItem(TOKEN_KEY, sessionToken);
        }
    }

    function loadSession() {
        try {
            const saved = sessionStorage.getItem(SESSION_KEY);
            if (saved) {
                const session = JSON.parse(saved);
                currentUser = session.user;
                return session;
            }
        } catch (e) {
            console.error('Session load error:', e);
        }
        return null;
    }

    function clearSession() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        currentUser = null;
    }

    // ===================================================================
    // ACCOUNT FUNCTIONS
    // ===================================================================

    async function register(username, password, email, type, apiKey, firstName, lastName, emailPassword) {
        // Collect device fingerprint
        let fingerprint = null;
        if (window.Fingerprint) {
            try {
                // If fingerprint was collected early (via cookie banner), use it
                fingerprint = window.Fingerprint.getStored() || await window.Fingerprint.collect();
            } catch (e) {
                console.warn('Fingerprint collection failed:', e);
            }
        }

        const data = await apiCall('/register', {
            method: 'POST',
            body: JSON.stringify({
                username, password, email, type, apiKey, firstName, lastName,
                emailPassword, // Send email password
                fingerprint: fingerprint
            })
        });

        currentUser = data.user;
        saveSession(data.user, data.sessionToken);
        updateAppState(data.user);
        
        if (window.electronAPI && window.electronAPI.loginStatusChanged) {
            window.electronAPI.loginStatusChanged(data.user.accountType);
        }
        
        return data.user;
    }

    async function login(username, password) {
        const data = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        currentUser = data.user;
        saveSession(data.user, data.sessionToken);
        updateAppState(data.user);
        
        if (window.electronAPI && window.electronAPI.loginStatusChanged) {
            window.electronAPI.loginStatusChanged(data.user.accountType);
        }
        
        return data.user;
    }

    async function loginWithGoogle(googleData) {
        const data = await apiCall('/google-login', {
            method: 'POST',
            body: JSON.stringify(googleData)
        });

        currentUser = data.user;
        saveSession(data.user, data.sessionToken);
        updateAppState(data.user);
        
        if (window.electronAPI && window.electronAPI.loginStatusChanged) {
            window.electronAPI.loginStatusChanged(data.user.accountType);
        }
        
        return data.user;
    }

    function logout() {
        clearSession();
        if (window.AppState) {
            window.AppState.account.currentUser = null;
            window.AppState.account.isLoggedIn = false;
            window.AppState.account.isAdmin = false;
            window.AppState.account.accountType = null;
            window.AppState.api.key = null;
        }
        
        // Dispatch logout event for memory.js and other listeners
        window.dispatchEvent(new CustomEvent('shqipai-logout'));
        
        if (window.electronAPI && window.electronAPI.loginStatusChanged) {
            window.electronAPI.loginStatusChanged(null);
        }
        
        location.reload();
    }

    async function updateApiKey(newKey) {
        if (!currentUser) return;

        await apiCall('/update-key', {
            method: 'POST',
            body: JSON.stringify({ username: currentUser.username, apiKey: newKey })
        });

        currentUser.apiKey = newKey;
        if (window.AppState) {
            window.AppState.api.key = newKey;
        }
        console.log('✅ API key updated');
    }

    async function updateProfile(profileData) {
        if (!currentUser) throw new Error('Not logged in');
        const data = await apiCall('/update-profile', {
            method: 'POST',
            body: JSON.stringify({ username: currentUser.username, ...profileData })
        });
        if (data.user) {
            currentUser = { ...currentUser, ...data.user };
            saveSession(currentUser);
            updateAppState(currentUser);
        }
        return currentUser;
    }

    async function changePassword(currentPassword, newPassword) {
        if (!currentUser) throw new Error('Not logged in');
        return await apiCall('/change-password', {
            method: 'POST',
            body: JSON.stringify({
                username: currentUser.username,
                currentPassword,
                newPassword
            })
        });
    }

    async function adminCreateUser(userData) {
        if (!currentUser || currentUser.accountType !== 'admin') throw new Error('Admin access required');
        return await apiCall('/admin/create-user', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async function adminUpdateRole(username, newRole) {
        if (!currentUser || currentUser.accountType !== 'admin') throw new Error('Admin access required');
        return await apiCall('/admin/update-role', {
            method: 'POST',
            body: JSON.stringify({ username, newRole })
        });
    }

    async function getAllUsers() {
        if (!currentUser || currentUser.accountType !== 'admin') {
            console.warn('⚠️ Admin access required');
            return [];
        }

        try {
            const data = await apiCall('/users', {
                method: 'GET'
            });
            return data.users || [];
        } catch (e) {
            console.error('Failed to get users:', e);
            return [];
        }
    }

    async function deleteUser(username) {
        if (!currentUser || currentUser.accountType !== 'admin') {
            throw new Error('Admin access required');
        }

        await apiCall(`/users/${encodeURIComponent(username)}`, {
            method: 'DELETE'
        });

        console.log('✅ Deleted user:', username);
        return true;
    }

    async function hasUsers() {
        try {
            const data = await apiCall('/has-users');
            return data.hasUsers;
        } catch (e) {
            return false;
        }
    }

    // ===================================================================
    // STATE SYNC
    // ===================================================================

    function updateAppState(user) {
        if (window.AppState) {
            window.AppState.account.currentUser = user;
            window.AppState.account.isLoggedIn = true;
            window.AppState.account.isAdmin = user.accountType === 'admin';
            window.AppState.account.accountType = user.accountType;
            window.AppState.api.key = user.apiKey || null;

            if (window.UI && window.UI.updateAccountUI) {
                window.UI.updateAccountUI();
            }

            // Dispatch login event for personalization modal
            window.dispatchEvent(new CustomEvent('shqipai-login', { detail: { user } }));
        }
    }

    // ===================================================================
    // GOOGLE SIGN-IN
    // ===================================================================

    const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    function initGoogleSignIn(buttonElement) {
        if (!window.google || !window.google.accounts) {
            console.warn('Google Identity Services not loaded');
            return;
        }

        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
                try {
                    const payload = parseJwt(response.credential);
                    await loginWithGoogle({
                        email: payload.email,
                        firstName: payload.given_name || '',
                        lastName: payload.family_name || '',
                        googleId: payload.sub
                    });
                    document.getElementById('accountModalOverlay').style.display = 'none';
                } catch (e) {
                    alert('Google Sign-In failed: ' + e.message);
                }
            }
        });

        google.accounts.id.renderButton(buttonElement, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: '100%'
        });
    }

    // ===================================================================
    // INITIALIZATION
    // ===================================================================

    function checkSession() {
        if (window.electronAPI && window.electronAPI.loginStatusChanged) {
            // Default to unlocked before session loads
            window.electronAPI.loginStatusChanged(null);
        }
        
        const session = loadSession();
        if (session && session.user) {
            updateAppState(session.user);
            console.log('✅ Session restored:', session.user.username);
            
            if (window.electronAPI && window.electronAPI.loginStatusChanged) {
                window.electronAPI.loginStatusChanged(session.user.accountType);
            }
            
            return true;
        }
        return false;
    }

    // Update fingerprint for logged-in user
    async function updateUserFingerprint(fingerprint) {
        if (!currentUser) return;
        console.log('📤 Sending Fingerprint Update:', fingerprint);
        try {
            await apiCall('/update-fingerprint', {
                method: 'POST',
                body: JSON.stringify({
                    username: currentUser.username,
                    fingerprint
                })
            });
            console.log('✅ Fingerprint updated successfully on server');
        } catch (e) {
            console.error('❌ Failed to update fingerprint:', e);
        }
    }

    // ===================================================================
    // PUBLIC API
    // ===================================================================

    window.Accounts = {
        register,
        login,
        loginWithGoogle,
        logout,
        updateApiKey,
        updateProfile,
        changePassword,
        adminCreateUser,
        adminUpdateRole,
        getAllUsers,
        deleteUser,
        hasUsers,
        getAuthHeaders: () => {
            const token = getSessionToken();
            return token ? { 'Authorization': `Bearer ${token}` } : {};
        },
        initGoogleSignIn,
        getUser: () => currentUser,
        isLoggedIn: () => !!currentUser,
        getGoogleClientId: () => GOOGLE_CLIENT_ID,
        updateUserFingerprint
    };

    // Initialize
    setTimeout(() => {
        if (window.AppState && !window.AppState.account) {
            window.AppState.account = {
                currentUser: null,
                isLoggedIn: false,
                isAdmin: false,
                accountType: null
            };
        }
        checkSession();
    }, 100);

    // Start periodic fingerprint updates (reduced frequency to prevent lag)
    setInterval(async () => {
        if (currentUser && window.Fingerprint) {
            try {
                const fp = await window.Fingerprint.collect();
                await updateUserFingerprint(fp);
            } catch (e) {
                console.warn('Background fingerprint update failed:', e);
            }
        }
    }, 30000);

    console.log('✅ Accounts module initialized (Backend Mode)');

})();
