/**
 * API Client Module
 *
 * This module handles communication with the backend API.
 */

const ApiClient = {
    // Base URL for API requests
    BASE_URL: '/api', // Default path

    // Initialize the API client with the correct base URL
    init: function() {
        // Check if we're running in a development environment
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // For local development, we might need to use the full URL
            this.BASE_URL = window.location.protocol + '//' + window.location.host + '/api';
        }
        console.log('API Client initialized with BASE_URL:', this.BASE_URL);

        // Check if user is already logged in
        if (this.isLoggedIn()) {
            console.log('User is logged in:', this.getCurrentUser());
        } else {
            console.log('No user is logged in');
        }
    },

    // Get the stored authentication token
    getToken: function() {
        return localStorage.getItem('auth_token');
    },

    // Set the authentication token
    setToken: function(token) {
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    },

    // Get the current user from localStorage
    getCurrentUser: function() {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    },

    // Set the current user in localStorage
    setCurrentUser: function(user) {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');
        } else {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
        }
    },

    // Check if user is logged in
    isLoggedIn: function() {
        return localStorage.getItem('isLoggedIn') === 'true';
    },

    // Make an API request with proper headers
    request: async function(endpoint, method = 'GET', data = null) {
        const url = `${this.BASE_URL}${endpoint}`;
        const token = this.getToken();

        console.log(`Making ${method} request to ${url}`);
        if (data) {
            console.log('Request data:', data);
        }

        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Token ${token}`;
            console.log(`Using token: ${token}`);
        } else {
            console.log('No token available');
        }

        const config = {
            method,
            headers,
            credentials: 'include',
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            console.log('Fetch config:', config);
            const response = await fetch(url, config);
            console.log(`Response status: ${response.status}`);

            // Try to parse JSON response
            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
                console.log('Response data:', responseData);
            } else {
                const text = await response.text();
                console.log('Response text:', text);
                responseData = { message: text };
            }

            if (!response.ok) {
                console.error(`API error: ${response.status}`, responseData);
                throw {
                    status: response.status,
                    data: responseData
                };
            }

            return responseData;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    },

    // Register a new user
    register: async function(userData) {
        try {
            const response = await this.request('/register/', 'POST', userData);

            // Store token and user data
            this.setToken(response.token);
            this.setCurrentUser(response.user);

            return {
                success: true,
                user: response.user,
                message: response.message
            };
        } catch (error) {
            return {
                success: false,
                message: error.data?.message || 'Registration failed',
                errors: error.data
            };
        }
    },

    // Login a user
    login: async function(credentials) {
        try {
            console.log('Login attempt with credentials:', credentials);

            // Make sure we have either username or email
            if (!credentials.username && !credentials.email) {
                console.error('Login failed: No username or email provided');
                return {
                    success: false,
                    message: 'Please provide either username or email'
                };
            }

            const response = await this.request('/login/', 'POST', credentials);
            console.log('Login response:', response);

            // Store token and user data
            if (response.token) {
                this.setToken(response.token);
                console.log('Token stored:', response.token);
            } else {
                console.error('No token received in login response');
            }

            if (response.user) {
                this.setCurrentUser(response.user);
                console.log('User data stored:', response.user);
            } else {
                console.error('No user data received in login response');
            }

            return {
                success: true,
                user: response.user,
                message: response.message || 'Login successful'
            };
        } catch (error) {
            console.error('Login error:', error);

            // Check if we have detailed error information
            const errorMessage = error.data?.message || 'Login failed';
            const userExists = error.data?.userExists !== undefined ? error.data.userExists : false;

            console.log(`Login failed: ${errorMessage}, User exists: ${userExists}`);

            return {
                success: false,
                message: errorMessage,
                userExists: userExists,
                error: error
            };
        }
    },

    // Logout the current user
    logout: async function() {
        try {
            console.log('Logout attempt');

            // Check if we have a token
            const token = this.getToken();
            if (!token) {
                console.log('No token found, clearing local data only');
                this.setToken(null);
                this.setCurrentUser(null);
                return { success: true, message: 'Logged out (local only)' };
            }

            // Try to logout on the server
            const response = await this.request('/logout/', 'POST');
            console.log('Logout response:', response);

            // Clear token and user data
            this.setToken(null);
            this.setCurrentUser(null);
            console.log('Local auth data cleared');

            return {
                success: true,
                message: response.message || 'Successfully logged out'
            };
        } catch (error) {
            console.error('Logout error:', error);

            // Even if the API call fails, clear local data
            this.setToken(null);
            this.setCurrentUser(null);
            console.log('Local auth data cleared after error');

            return {
                success: false,
                message: error.data?.message || 'Logout failed on server, but cleared local data',
                error: error
            };
        }
    },

    // Get current user details
    getUserDetails: async function() {
        try {
            // Check if we have a token first
            const token = this.getToken();
            if (!token) {
                return {
                    success: false,
                    message: 'No authentication token found. Please log in.'
                };
            }

            // Make the API request
            const response = await this.request('/user/');

            // Update the stored user data
            this.setCurrentUser(response);

            return {
                success: true,
                user: response
            };
        } catch (error) {
            console.error('Error getting user details:', error);

            // Handle specific error cases
            if (error.status === 401) {
                // Authentication error - clear the token and user data
                this.setToken(null);
                this.setCurrentUser(null);

                return {
                    success: false,
                    message: 'Authentication failed. Please log in again.'
                };
            }

            return {
                success: false,
                message: error.data?.message || 'Failed to get user details',
                error: error
            };
        }
    },

    // Update user profile
    updateProfile: async function(userData) {
        try {
            const response = await this.request('/user/update/', 'PATCH', userData);

            // Update stored user data
            this.setCurrentUser(response.user);

            return {
                success: true,
                user: response.user,
                message: response.message
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to update profile',
                errors: error.data
            };
        }
    },

    // Change password
    changePassword: async function(passwordData) {
        try {
            const response = await this.request('/user/change-password/', 'POST', passwordData);

            // Update token if provided
            if (response.token) {
                this.setToken(response.token);
            }

            return {
                success: true,
                message: response.message
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to change password',
                errors: error.data
            };
        }
    }
};

// Initialize the API client
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the API client
    ApiClient.init();

    // Add a debug function to help troubleshoot
    window.debugApiClient = function() {
        console.log('API Client Debug:');
        console.log('BASE_URL:', ApiClient.BASE_URL);
        console.log('isLoggedIn:', ApiClient.isLoggedIn());
        console.log('Token:', ApiClient.getToken());
        console.log('Current User:', ApiClient.getCurrentUser());

        // Check localStorage directly
        console.log('localStorage:');
        console.log('auth_token:', localStorage.getItem('auth_token'));
        console.log('currentUser:', localStorage.getItem('currentUser'));
        console.log('isLoggedIn:', localStorage.getItem('isLoggedIn'));

        return {
            isLoggedIn: ApiClient.isLoggedIn(),
            currentUser: ApiClient.getCurrentUser(),
            token: ApiClient.getToken()
        };
    };
});
