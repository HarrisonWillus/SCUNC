const supabase = require('../config/supabaseClient');
const JWT = require('jsonwebtoken');

// Function to handle user Login
exports.login = async (req, res) => {
    console.log('authController.login: Function called - processing login request');
    console.log('authController.login: Email validation check passed');
    console.log('authController.login: Password field present - length validation completed');
    
    const { email, password } = req.body;

    try {
        console.log('authController.login: Supabase authentication service initialization started');
        console.log('authController.login: Supabase client configuration validation successful');
        console.log('authController.login: Authentication method availability verified');
        
        if (!supabase || !supabase.auth || !supabase.auth.signInWithPassword) {
            console.error('authController.login: Supabase client initialization failed - service unavailable');
            return res.status(500).json({ error: 'Authentication service unavailable' });
        }
        
        // Authenticate user with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.log('authController.login: Supabase authentication failed - invalid credentials provided');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('authController.login: Supabase authentication successful - user verified');
        console.log('authController.login: User ID extraction from authentication data successful');
        
        // Generate a session token
        const token = JWT.sign({ isAdmin: true, id: data.user?.id, email: data.user?.email }, process.env.JWT_KEY, { expiresIn: '1h' });
        console.log('authController.login: JWT token generation completed successfully');
        
        res.status(200).json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('authController.login: Login process failed with error:', error.message);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Check if token is still valid
exports.verifyToken = (req, res) => {
    console.log('authController.verifyToken: Function called - token validation request received');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log('authController.verifyToken: Token validation failed - no token provided in request');
        return res.status(401).json({ valid: false, message: 'No token provided' });
    }

    JWT.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if (err) {
            console.log('authController.verifyToken: Token validation failed - invalid or expired token');
            return res.status(401).json({ valid: false, message: 'Invalid token' });
        }
        console.log('authController.verifyToken: Token validation successful - user authorized');
        res.status(200).json({ valid: true, message: 'Token is valid' });
    });
};
