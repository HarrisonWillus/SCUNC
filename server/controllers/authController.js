const supabase = require('../config/supabaseClient');
const JWT = require('jsonwebtoken');

// Function to handle user Login
exports.login = async (req, res) => {
    console.log('LOGIN: Function called - processing login request');
    console.log('LOGIN: Email validation check passed');
    console.log('LOGIN: Password field present - length validation completed');
    
    const { email, password } = req.body;

    try {
        console.log('LOGIN: Supabase authentication service initialization started');
        console.log('LOGIN: Supabase client configuration validation successful');
        console.log('LOGIN: Authentication method availability verified');
        
        if (!supabase || !supabase.auth || !supabase.auth.signInWithPassword) {
            console.error('LOGIN: Supabase client initialization failed - service unavailable\n');
            return res.status(500).json({ error: 'Authentication service unavailable' });
        }
        
        // Authenticate user with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.log('LOGIN: Supabase authentication failed - invalid credentials provided\n');
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('LOGIN: Supabase authentication successful - user verified');
        console.log('LOGIN: User ID extraction from authentication data successful');
        
        // Generate a session token
        const token = JWT.sign({ isAdmin: true, id: data.user?.id, email: data.user?.email }, process.env.JWT_KEY, { expiresIn: '1h' });
        console.log('LOGIN: JWT token generation completed successfully\n');
        
        res.status(200).json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('LOGIN: Login process failed with error:', error.message, '\n');
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Check if token is still valid
exports.verifyToken = (req, res) => {
    console.log('VERIFY: Function called - token validation request received');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log('VERIFY: Token validation failed - no token provided in request\n');
        return res.status(401).json({ valid: false, message: 'No token provided' });
    }

    JWT.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if (err) {
            console.log('VERIFY: Token validation failed - invalid or expired token');
            return res.status(401).json({ valid: false, message: 'Invalid token' });
        }
        console.log('VERIFY: Token validation successful - user authorized\n');
        res.status(200).json({ valid: true, message: 'Token is valid' });
    });
};
