const supabase = require('../config/supabaseClient');
const JWT = require('jsonwebtoken');

// Function to handle user Login
exports.login = async (req, res) => {
    console.log('Step 1: Login attempt received');
    console.log('Step 2: Processing email:', req.body.email);
    console.log('Step 3: Password length validation:', req.body.password ? req.body.password.length : 0);
    
    const { email, password } = req.body;

    try {
        console.log('Step 4: Initiating Supabase authentication process');
        console.log('Step 5: Validating Supabase object type:', typeof supabase);
        console.log('Step 6: Checking Supabase auth availability:', !!supabase?.auth);
        console.log('Step 7: Verifying signInWithPassword method availability:', !!supabase?.auth?.signInWithPassword);
        
        if (!supabase || !supabase.auth || !supabase.auth.signInWithPassword) {
            console.error('Step 8: Supabase client initialization failure detected');
            return res.status(500).json({ error: 'Authentication service unavailable' });
        }
        
        // Authenticate user with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.log('Step 9: Supabase authentication failed with error:', error.message);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('Step 10: Supabase authentication completed successfully');
        console.log('Step 11: Retrieved user ID from authentication data:', data.user?.id);
        
        // Generate a session token
        const token = JWT.sign({ isAdmin: true, id: data.user?.id, email: data.user?.email }, process.env.JWT_KEY, { expiresIn: '1h' });
        console.log('Step 12: JWT token generation completed successfully');
        
        res.status(200).json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('Step 13: Login process encountered error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Check if token is still valid
exports.verifyToken = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ valid: false, message: 'No token provided' });
    }

    JWT.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: 'Invalid token' });
        }
        res.status(200).json({ valid: true, message: 'Token is valid' });
    });
};
