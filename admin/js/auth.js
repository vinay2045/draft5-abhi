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
 * API Request handler for admin panel
 * Manages authentication and API communication
 * 
 * @param {string} endpoint - API endpoint to call
 * @param {string|object} method - HTTP method (GET, POST, PUT, DELETE) or options object
 * @param {object} data - Optional data to send with request
 * @param {object} customHeaders - Optional custom headers
 * @returns {Promise} - Promise with the API response
 */
async function apiRequest(endpoint, method = 'GET', data = null, customHeaders = {}) {
    try {
        // Handle case where method is actually an options object
        let requestMethod = method;
        let requestData = data;
        let requestHeaders = customHeaders;
        
        // Check if second parameter is actually an options object
        if (typeof method === 'object' && method !== null) {
            requestMethod = method.method || 'GET';
            requestData = method.body || null;
            requestHeaders = method.headers || {};
        }
        
        // Normalize endpoint (ensure it starts with a slash)
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        
        // Add /api prefix if it's not already there
        let apiEndpoint = endpoint;
        if (!apiEndpoint.startsWith('/api/')) {
            apiEndpoint = '/api' + apiEndpoint;
        }
        
        // Build URL with the API prefix
        const fullUrl = `${window.location.origin}${apiEndpoint}`;
        
        console.log(`Making ${requestMethod} request to: ${fullUrl}`);
        
        // Prepare request options
        const options = {
            method: requestMethod,
            headers: {
                ...requestHeaders
            },
            credentials: 'same-origin'
        };
        
        // Add auth token if available
        const token = getToken();
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add content-type and handle data for POST, PUT methods
        if (requestData) {
            // Only set Content-Type if not already set and not multipart form data
            if (!requestHeaders['Content-Type'] && 
                !requestHeaders['content-type'] && 
                !(requestData instanceof FormData)) {
                options.headers['Content-Type'] = 'application/json';
            }
            
            // Handle JSON stringification properly
            if (options.headers['Content-Type'] === 'application/json') {
                // Check if requestData is already a string (pre-stringified JSON)
                if (typeof requestData === 'string') {
                    try {
                        // Make sure it's valid JSON by parsing and re-stringifying
                        const parsed = JSON.parse(requestData);
                        options.body = JSON.stringify(parsed);
                    } catch (e) {
                        console.error('Invalid JSON string provided:', e);
                        throw new Error('Invalid JSON string provided: ' + e.message);
                    }
                } else {
                    // Normal object that needs to be stringified
                    options.body = JSON.stringify(requestData);
                }
            } else {
                // For FormData or other types
                options.body = requestData;
            }
        }
        
        // Make the request
        const response = await fetch(fullUrl, options);
        
        // Handle 401 Unauthorized (redirect to login)
        if (response.status === 401) {
            console.warn('Authentication required, redirecting to login');
            logout();
            return null;
        }
        
        // Handle other non-OK responses
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            
            try {
                // Try to parse error as JSON
                errorData = JSON.parse(errorText);
            } catch (e) {
                // If not JSON, use text as message
                errorData = { message: errorText || `HTTP error ${response.status}` };
            }
            
            // Log the error
            console.error(`API error (${response.status}):`, errorData);
            
            // Throw formatted error object
            throw {
                status: response.status,
                statusText: response.statusText,
                ...errorData
            };
        }
        
        // Check if response is empty
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            // Parse JSON response
            return await response.json();
        } else {
            // Return text for non-JSON responses
            return await response.text();
        }
        
    } catch (error) {
        // Log the error
        console.error('API request error:', error);
        
        // Re-throw for handling by caller
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