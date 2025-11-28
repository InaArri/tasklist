// ===== Authentication Utility Functions =====

// Get stored token
function getToken() {
    return localStorage.getItem('taskflow-token');
}

// Get stored user
function getUser() {
    const userStr = localStorage.getItem('taskflow-user');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Logout user
function logout() {
    localStorage.removeItem('taskflow-token');
    localStorage.removeItem('taskflow-user');
    window.location.href = 'login.html';
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Make authenticated API request
async function authenticatedFetch(url, options = {}) {
    const token = getToken();

    if (!token) {
        throw new Error('No authentication token found');
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Session expired. Please login again.');
    }

    return response;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getToken,
        getUser,
        isAuthenticated,
        logout,
        requireAuth,
        authenticatedFetch
    };
}
