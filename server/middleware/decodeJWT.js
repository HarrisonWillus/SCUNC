const JWT = require('jsonwebtoken');

function sendUserThrough(req, res, next) {
    console.log('Step 1: Token decode middleware initiated');
    console.log('Step 2: Request path analysis:', req.path);
    console.log('Step 3: Request method verification:', req.method);
    
    // Check for authorization header
    const authHeader = req.headers.authorization;
    console.log('Step 4: Authorization header presence check:', !!authHeader);
    
    const token = authHeader?.split(' ')[1];
    console.log('Step 5: Token extraction completed:', !!token);
    
    if (!token) {
        console.log('Step 6: No token provided - continuing without user data');
        // Continue without setting req.user (for public routes)
        return next();
    }

    try {
        console.log('Step 7: Attempting to decode JWT token');
        
        const decoded = JWT.verify(token, process.env.JWT_KEY);
        console.log('Step 8: Token decoded successfully');
        console.log('Step 9: Decoded token data analysis:', {
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
        
        console.log('Step 10: req.user set with decoded data');
        console.log('Step 11: Proceeding to next middleware or controller');
        
        next();
    } catch (error) {
        console.log('Step 12: Token decode process failed');
        console.log('Step 13: Error type identification:', error.name);
        console.log('Step 14: Error message details:', error.message);
        
        // Provide specific error information but continue without user data
        if (error.name === 'TokenExpiredError') {
            console.log('Step 15: Token has expired - continuing without user data');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('Step 16: Malformed token detected - continuing without user data');
        } else if (error.name === 'NotBeforeError') {
            console.log('Step 17: Token not active yet - continuing without user data');
        }
        
        console.log('Step 18: Continuing request without user authentication');
        // Don't set req.user, but continue (for public routes or optional auth)
        next();
    }
}

module.exports = sendUserThrough;