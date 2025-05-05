/**
 * Server Simulation Module
 *
 * This module simulates server-side functionality for user authentication.
 * In a real application, these operations would be performed on a server.
 */

const ServerSimulation = {
    // Storage key for user data
    USER_STORAGE_KEY: 'allbet_users',

    // Initialize the user data if it doesn't exist
    init: function() {
        if (!localStorage.getItem(this.USER_STORAGE_KEY)) {
            localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify({ users: [] }));
        }
        console.log('Server simulation initialized');
        return this;
    },

    // Save user data to storage
    saveUserData: async function(userData) {
        try {
            // In a real application, this would be a server-side API call
            // For this simulation, we'll use localStorage as a stand-in for file storage
            localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(userData));
            console.log('User data saved:', userData);
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    },

    // Find user by email
    findUserByEmail: async function(email) {
        // Load user data
        const userData = await this.getUserData();
        console.log('Looking for user with email:', email);
        console.log('User data:', userData);

        // Find user with matching email
        const user = userData.users.find(user => user.email === email);
        console.log('Found user:', user);
        return user;
    },

    // Get all users
    getUserData: async function() {
        try {
            // Get from localStorage
            const storedData = localStorage.getItem(this.USER_STORAGE_KEY);
            if (!storedData) {
                // Initialize if not found
                this.init();
                return { users: [] };
            }

            const userData = JSON.parse(storedData);
            console.log('Retrieved user data:', userData);
            return userData;
        } catch (error) {
            console.error('Error getting user data:', error);
            return { users: [] };
        }
    },

    // Register a new user
    registerUser: async function(user) {
        try {
            console.log('Registering user:', user);

            // Load existing user data
            const userData = await this.getUserData();

            // Check if user already exists
            const existingUser = userData.users.find(u => u.email === user.email);
            if (existingUser) {
                console.log('User already exists:', existingUser);
                return {
                    success: false,
                    message: 'User with this email already exists'
                };
            }

            // Add new user with ID and timestamp
            const newUser = {
                ...user,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };

            console.log('New user to add:', newUser);

            // Add to users array
            userData.users.push(newUser);

            // Save updated user data
            const saveResult = await this.saveUserData(userData);
            if (!saveResult) {
                return {
                    success: false,
                    message: 'Failed to save user data'
                };
            }

            console.log('User registered successfully:', newUser);

            // Return success with user data (excluding password)
            const userWithoutPassword = { ...newUser };
            delete userWithoutPassword.password;

            return {
                success: true,
                user: userWithoutPassword
            };
        } catch (error) {
            console.error('Error registering user:', error);
            return {
                success: false,
                message: 'Error registering user: ' + error.message
            };
        }
    },

    // Verify user credentials
    verifyCredentials: async function(email, password) {
        try {
            console.log('Verifying credentials for:', email);

            // Find user by email
            const user = await this.findUserByEmail(email);

            // If user not found
            if (!user) {
                console.log('User not found');
                return {
                    success: false,
                    message: 'User not found',
                    userExists: false
                };
            }

            console.log('User found, checking password');

            // Check password
            if (user.password !== password) {
                console.log('Invalid password');
                return {
                    success: false,
                    message: 'Invalid password',
                    userExists: true
                };
            }

            console.log('Password correct, login successful');

            // Return success with user data (excluding password)
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;

            return {
                success: true,
                user: userWithoutPassword,
                userExists: true
            };
        } catch (error) {
            console.error('Error verifying credentials:', error);
            return {
                success: false,
                message: 'Error verifying credentials: ' + error.message,
                userExists: false
            };
        }
    }
};

// Initialize the server simulation
ServerSimulation.init();
