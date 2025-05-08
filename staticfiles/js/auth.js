/**
 * Authentication Module
 *
 * This module handles user authentication including:
 * - User registration
 * - User login
 * - Session management
 * - Data persistence
 */

// Authentication Database - uses server simulation for file-based storage
const AuthDB = {
    // Initialize the database
    init: async function() {
        // Nothing to initialize for file-based storage
        return this;
    },

    // Add a new user
    addUser: async function(userData) {
        try {
            // Use server simulation to register user
            return await ServerSimulation.registerUser(userData);
        } catch (error) {
            console.error('Error adding user:', error);
            return { success: false, message: 'Error adding user: ' + error.message };
        }
    },

    // Find user by email
    findUserByEmail: async function(email) {
        try {
            // Use server simulation to find user
            return await ServerSimulation.findUserByEmail(email);
        } catch (error) {
            console.error('Error finding user:', error);
            return null;
        }
    },

    // Verify user credentials
    verifyCredentials: async function(email, password) {
        try {
            // Use server simulation to verify credentials
            return await ServerSimulation.verifyCredentials(email, password);
        } catch (error) {
            console.error('Error verifying credentials:', error);
            return { success: false, message: 'Error verifying credentials: ' + error.message };
        }
    }
};

// Authentication Controller
const Auth = {
    // Initialize the auth system
    init: async function() {
        await AuthDB.init();
        this.checkAuthState();
        return this;
    },

    // Register a new user
    register: async function(userData) {
        // Basic validation
        if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
            return { success: false, message: 'Missing required fields' };
        }

        try {
            // Add user to database
            const result = await AuthDB.addUser(userData);

            // If registration is successful, log the user in
            if (result.success) {
                this.setCurrentUser(result.user);
            }

            return result;
        } catch (error) {
            console.error('Error registering user:', error);
            return { success: false, message: 'Error registering user: ' + error.message };
        }
    },

    // Login a user
    login: async function(email, password) {
        try {
            // Verify credentials
            const result = await AuthDB.verifyCredentials(email, password);

            // If login is successful, set the current user
            if (result.success) {
                this.setCurrentUser(result.user);
            }

            // Return result with userExists flag
            return {
                success: result.success,
                message: result.message,
                userExists: result.userExists
            };
        } catch (error) {
            console.error('Error logging in:', error);
            return {
                success: false,
                message: 'Error logging in: ' + error.message,
                userExists: false
            };
        }
    },

    // Logout the current user
    logout: function() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        return { success: true };
    },

    // Set the current user
    setCurrentUser: function(user) {
        // Make sure we have a user object
        if (!user) {
            console.error('Cannot set current user: user is null or undefined');
            return;
        }

        // Don't store the password in the session
        const userWithoutPassword = { ...user };
        if (userWithoutPassword.password) {
            delete userWithoutPassword.password;
        }

        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        localStorage.setItem('isLoggedIn', 'true');
    },

    // Get the current user
    getCurrentUser: function() {
        const userJson = localStorage.getItem('currentUser');
        return userJson ? JSON.parse(userJson) : null;
    },

    // Check if user is logged in
    isLoggedIn: function() {
        return localStorage.getItem('isLoggedIn') === 'true';
    },

    // Check authentication state and update UI
    checkAuthState: function() {
        const isLoggedIn = this.isLoggedIn();
        const currentUser = this.getCurrentUser();

        console.log("Checking auth state:", isLoggedIn, currentUser);

        // Update login button if it exists
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            if (isLoggedIn && currentUser) {
                console.log("User is logged in, updating UI");
                loginBtn.textContent = currentUser.firstName || 'Account';

                // Change login button behavior to logout
                loginBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (confirm('Would you like to log out?')) {
                        console.log("Logging out user");
                        Auth.logout();
                        window.location.reload();
                    }
                };

                // Add a visual indicator that the user is logged in
                loginBtn.classList.add('logged-in');
                loginBtn.style.backgroundColor = '#4CAF50';
                loginBtn.style.color = 'white';
            } else {
                console.log("User is not logged in");
                loginBtn.textContent = 'Login';
                loginBtn.classList.remove('logged-in');
                loginBtn.style.backgroundColor = '';
                loginBtn.style.color = '';

                // Reset onclick to open login modal
                loginBtn.onclick = null; // Remove any existing handler
            }
        }

        return { isLoggedIn, currentUser };
    }
};

// Initialize the auth system when the script loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM loaded, initializing Auth system");
    try {
        // Make sure ServerSimulation is initialized first
        if (typeof ServerSimulation !== 'undefined') {
            ServerSimulation.init();
            console.log("Server simulation initialized");
        } else {
            console.error("ServerSimulation is not defined!");
        }

        // Initialize Auth system
        await Auth.init();
        console.log("Auth system initialized");

        // Check if we need to set up the login button click handler
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn && !Auth.isLoggedIn()) {
            console.log("Setting up login button click handler");
            loginBtn.addEventListener('click', function() {
                console.log("Login button clicked");
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    loginModal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }
            });
        }
    } catch (error) {
        console.error("Error initializing Auth system:", error);
    }
});
