const JWT = require('jsonwebtoken');

function isAdmin(req, res, next) {
    console.log('🔐 ADMIN MIDDLEWARE: Admin authorization check initiated');
    console.log('🛣️ ADMIN MIDDLEWARE: Request path:', req.path);
    console.log('📋 ADMIN MIDDLEWARE: Request method:', req.method);
    console.log('🌐 ADMIN MIDDLEWARE: Request origin:', req.get('origin') || 'No origin header');
    
    // Check for authorization header
    const authHeader = req.headers.authorization;
    console.log('🎫 ADMIN MIDDLEWARE: Authorization header present:', !!authHeader);
    console.log('🎫 ADMIN MIDDLEWARE: Authorization header format:', authHeader ? authHeader.substring(0, 20) + '...' : 'NULL');
    
    const token = authHeader?.split(' ')[1];
    console.log('🔑 ADMIN MIDDLEWARE: Token extracted:', !!token);
    console.log('🔑 ADMIN MIDDLEWARE: Token length:', token ? token.length : 0);
    console.log('🔑 ADMIN MIDDLEWARE: Token preview:', token ? token.substring(0, 20) + '...' : 'NULL');
    
    if (!token) {
        console.log('❌ ADMIN MIDDLEWARE: No token provided - returning 401 Unauthorized');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        console.log('🔍 ADMIN MIDDLEWARE: Attempting to verify JWT token...');
        console.log('🔐 ADMIN MIDDLEWARE: Using JWT_KEY present:', !!process.env.JWT_KEY);
        console.log('🔐 ADMIN MIDDLEWARE: JWT_KEY length:', process.env.JWT_KEY ? process.env.JWT_KEY.length : 0);
        
        const decoded = JWT.verify(token, process.env.JWT_KEY);
        console.log('✅ ADMIN MIDDLEWARE: Token verified successfully');
        console.log('👤 ADMIN MIDDLEWARE: Decoded token data:', {
            userId: decoded.id || 'No ID',
            email: decoded.email || 'No email',
            isAdmin: decoded.isAdmin,
            iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'No issued at',
            exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiry'
        });
        
        if (decoded.isAdmin) {
            console.log('✅ ADMIN MIDDLEWARE: User has admin privileges - access granted');
            console.log('👤 ADMIN MIDDLEWARE: Setting req.user with decoded token data');
            
            // Attach user data to request object for next middleware/controller
            req.user = {
                id: decoded.id,
                email: decoded.email,
                isAdmin: decoded.isAdmin,
                iat: decoded.iat,
                exp: decoded.exp
            };
            
            console.log('📤 ADMIN MIDDLEWARE: req.user set with data:', {
                id: req.user.id,
                email: req.user.email,
                isAdmin: req.user.isAdmin
            });
            console.log('➡️ ADMIN MIDDLEWARE: Proceeding to next middleware/controller');
            
            next();
        } else {
            console.log('❌ ADMIN MIDDLEWARE: User lacks admin privileges - returning 403 Forbidden');
            console.log('👤 ADMIN MIDDLEWARE: User ID:', decoded.id);
            console.log('📧 ADMIN MIDDLEWARE: User email:', decoded.email);
            res.status(403).json({ message: 'Forbidden' });
        }
    } catch (error) {
        console.log('💥 ADMIN MIDDLEWARE: Token verification failed');
        console.log('🔍 ADMIN MIDDLEWARE: Error type:', error.name);
        console.log('📋 ADMIN MIDDLEWARE: Error message:', error.message);
        console.log('🔑 ADMIN MIDDLEWARE: Token that failed:', token ? token.substring(0, 30) + '...' : 'NULL');
        
        // Provide specific error information
        if (error.name === 'TokenExpiredError') {
            console.log('⏰ ADMIN MIDDLEWARE: Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('🚫 ADMIN MIDDLEWARE: Malformed token');
        } else if (error.name === 'NotBeforeError') {
            console.log('⏳ ADMIN MIDDLEWARE: Token not active yet');
        }
        
        console.log('❌ ADMIN MIDDLEWARE: Returning 401 Invalid token');
        res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports = isAdmin;