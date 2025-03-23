/**
 * Admin Authentication Utilities
 * Handles login, logout, session management and authentication checks
 */

// Constants
const API_URL = '/api'; // Base API path
const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

/**
 * Attempt to login with provided credentials
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Promise} - Resolves with user data if successful
 */
async function login(username, password) {
    try {
        const response = await fetch(`/api/auth/admin-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        let data;
        try {
            // Safely parse JSON response
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            throw new Error('Unable to parse server response. Please try again.');
        }

        if (!response.ok) {
            throw new Error(data.message || 'Login failed. Server returned: ' + response.status);
        }

        if (!data.token) {
            throw new Error('Invalid server response: Authentication token missing');
        }

        // Store token and user data
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        return data.user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Log the current user out
 */
function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Redirect to login page
    window.location.href = '/admin/login.html';
}

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Get the current authentication token
 * @returns {string|null} - The auth token or null
 */
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get the current user data
 * @returns {Object|null} - User data or null if not logged in
 */
function getCurrentUser() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Check if token is expired
 * @returns {boolean} - True if token is expired or invalid
 */
function isTokenExpired() {
    const token = getToken();
    if (!token) return true;
    
    try {
        // JWT tokens are in format: header.payload.signature
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        
        // Check if token is expired
        return decoded.exp < Date.now() / 1000;
    } catch (error) {
        console.error('Token validation error:', error);
        return true; // Consider invalid tokens as expired
    }
}

/**
 * Get auth header for API requests
 * @returns {Object} - Headers object with Authorization
 */
function getAuthHeaders() {
    const token = getToken();
    return {
        'x-auth-token': token,
        'Content-Type': 'application/json'
    };
}

/**
 * Check auth status and redirect if not authenticated
 * Use on protected pages
 */
function checkAuth() {
    if (!isAuthenticated() || isTokenExpired()) {
        // Save the current URL to redirect back after login
        const currentPath = window.location.pathname;
        if (currentPath !== '/admin/login.html') {
            sessionStorage.setItem('redirect_after_login', currentPath);
            window.location.href = '/admin/login.html';
        }
    }
}

/**
 * Make authenticated API requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
async function apiRequest(endpoint, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    
    const authHeaders = getAuthHeaders();
    options.headers = { ...options.headers, ...authHeaders };
    
    // Normalize endpoint by ensuring it starts with a slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Construct the full URL correctly handling admin endpoints
    // If the endpoint already contains '/admin/', don't add it again in the API_URL
    const baseURL = window.location.origin;
    // Use the current port instead of hardcoding 7777
    const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
    const serverURL = `${window.location.protocol}//${window.location.hostname}:${port}`;
    
    // Build the complete URL - fix the URL construction to avoid duplicate 'admin'
    let url;
    if (normalizedEndpoint.startsWith('/admin/')) {
        // For admin endpoints, use /api directly without adding 'admin' again
        url = `${serverURL}${API_URL}${normalizedEndpoint.replace('/admin', '')}`;
    } else {
        // For non-admin endpoints, use as is
        url = `${serverURL}${API_URL}${normalizedEndpoint}`;
    }
    
    console.log(`Making API request to: ${url}`);
    
    try {
        const response = await fetch(url, options);
        
        // Handle 401 Unauthorized (expired token)
        if (response.status === 401) {
            logout();
            throw new Error('Your session has expired. Please login again.');
        }
        
        // Handle other error statuses
        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            } else {
                throw new Error(`Request failed with status ${response.status}`);
            }
        }
        
        // Check content type to handle JSON vs non-JSON responses
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            // Parse JSON response
            return await response.json();
        } else {
            // For non-JSON responses
            const text = await response.text();
            console.warn('Non-JSON response received:', text.substring(0, 100) + '...');
            
            if (text.trim().startsWith('<')) {
                // HTML response, likely an error
                throw new Error('Received HTML instead of JSON. The server might be returning an error page.');
            }
            
            // Try to parse as JSON anyway as a fallback
            try {
                return text ? JSON.parse(text) : {};
            } catch (parseError) {
                console.error('JSON parsing error:', parseError);
                throw new Error('Received invalid data format from server.');
            }
        }
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Export functions for use in other scripts
window.AdminAuth = {
    login,
    logout,
    isAuthenticated,
    getCurrentUser,
    getToken,
    getAuthHeaders,
    checkAuth,
    apiRequest
}; 