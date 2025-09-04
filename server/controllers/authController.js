const supabase = require('../config/supabaseClient');
const JWT = require('jsonwebtoken');

// Function to handle user Login
exports.login = async (req, res) => {
    console.log('🔐 AUTH: Login attempt received');
    console.log('📧 Email:', req.body.email);
    console.log('🔑 Password length:', req.body.password ? req.body.password.length : 0);
    
    const { email, password } = req.body;

    try {
        console.log('🚀 AUTH: Attempting Supabase authentication...');
        console.log('🔍 AUTH: Supabase object type:', typeof supabase);
        console.log('🔍 AUTH: Supabase.auth available:', !!supabase?.auth);
        console.log('🔍 AUTH: signInWithPassword available:', !!supabase?.auth?.signInWithPassword);
        
        if (!supabase || !supabase.auth || !supabase.auth.signInWithPassword) {
            console.error('❌ AUTH: Supabase client not properly initialized');
            return res.status(500).json({ error: 'Authentication service unavailable' });
        }
        
        // Authenticate user with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.log('❌ AUTH: Supabase authentication failed:', error.message);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('✅ AUTH: Supabase authentication successful');
        console.log('👤 User ID:', data.user?.id);
        
        // Generate a session token
        const token = JWT.sign({ isAdmin: true, id: data.user?.id, email: data.user?.email }, process.env.JWT_KEY, { expiresIn: '1h' });
        console.log('🎫 AUTH: JWT token generated successfully');
        
        res.status(200).json({ token, message: 'Login successful' });
    } catch (error) {
        console.error('💥 AUTH: Login error:', error);
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
