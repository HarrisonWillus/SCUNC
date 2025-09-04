const JWT = require('jsonwebtoken');

function sendUserThrough(req, res, next) {
    console.log('🔓 JWT MIDDLEWARE: Token decode middleware initiated');
    console.log('🛣️ JWT MIDDLEWARE: Request path:', req.path);
    console.log('📋 JWT MIDDLEWARE: Request method:', req.method);
    
    // Check for authorization header
    const authHeader = req.headers.authorization;
    console.log('🎫 JWT MIDDLEWARE: Authorization header present:', !!authHeader);
    
    const token = authHeader?.split(' ')[1];
    console.log('🔑 JWT MIDDLEWARE: Token extracted:', !!token);
    
    if (!token) {
        console.log('⚠️ JWT MIDDLEWARE: No token provided - continuing without user data');
        // Continue without setting req.user (for public routes)
        return next();
    }

    try {
        console.log('🔍 JWT MIDDLEWARE: Attempting to decode JWT token...');
        
        const decoded = JWT.verify(token, process.env.JWT_KEY);
        console.log('✅ JWT MIDDLEWARE: Token decoded successfully');
        console.log('👤 JWT MIDDLEWARE: Decoded token data:', {
            userId: decoded.id || 'No ID',
            email: decoded.email || 'No email',
            isAdmin: decoded.isAdmin,
            iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'No issued at',
            exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiry'
        });
        
        // Attach user data to request object for next middleware/controller
        req.user = {
            id: decoded.id,
            email: decoded.email,
            isAdmin: decoded.isAdmin,
            iat: decoded.iat,
            exp: decoded.exp
        };
        
        console.log('📤 JWT MIDDLEWARE: req.user set with data');
        console.log('➡️ JWT MIDDLEWARE: Proceeding to next middleware/controller');
        
        next();
    } catch (error) {
        console.log('💥 JWT MIDDLEWARE: Token decode failed');
        console.log('🔍 JWT MIDDLEWARE: Error type:', error.name);
        console.log('📋 JWT MIDDLEWARE: Error message:', error.message);
        
        // Provide specific error information but continue without user data
        if (error.name === 'TokenExpiredError') {
            console.log('⏰ JWT MIDDLEWARE: Token has expired - continuing without user data');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('🚫 JWT MIDDLEWARE: Malformed token - continuing without user data');
        } else if (error.name === 'NotBeforeError') {
            console.log('⏳ JWT MIDDLEWARE: Token not active yet - continuing without user data');
        }
        
        console.log('⚠️ JWT MIDDLEWARE: Continuing request without user authentication');
        // Don't set req.user, but continue (for public routes or optional auth)
        next();
    }
}

module.exports = sendUserThrough;