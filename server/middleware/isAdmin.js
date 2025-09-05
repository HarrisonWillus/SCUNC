const JWT = require('jsonwebtoken');

function isAdmin(req, res, next) {
    console.log('Step 1: Admin authorization check initiated');
    console.log('Step 2: Request path analysis:', req.path);
    console.log('Step 3: Request method verification:', req.method);
    console.log('Step 4: Request origin header check:', req.get('origin') || 'No origin header');
    
    // Check for authorization header
    const authHeader = req.headers.authorization;
    console.log('Step 5: Authorization header presence verification:', !!authHeader);
    console.log('Step 6: Authorization header format preview:', authHeader ? authHeader.substring(0, 20) + '...' : 'NULL');
    
    const token = authHeader?.split(' ')[1];
    console.log('Step 7: Token extraction completed:', !!token);
    console.log('Step 8: Token length measurement:', token ? token.length : 0);
    console.log('Step 9: Token content preview:', token ? token.substring(0, 20) + '...' : 'NULL');
    
    if (!token) {
        console.log('Step 10: No token provided - returning 401 Unauthorized');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        console.log('Step 11: Attempting to verify JWT token');
        console.log('Step 12: JWT_KEY environment variable presence check:', !!process.env.JWT_KEY);
        console.log('Step 13: JWT_KEY length verification:', process.env.JWT_KEY ? process.env.JWT_KEY.length : 0);
        
        const decoded = JWT.verify(token, process.env.JWT_KEY);
        console.log('Step 14: Token verification completed successfully');
        console.log('Step 15: Decoded token data analysis:', {
            userId: decoded.id || 'No ID',
            email: decoded.email || 'No email',
            isAdmin: decoded.isAdmin,
            iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'No issued at',
            exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiry'
        });
        
        if (decoded.isAdmin) {
            console.log('Step 16: User has admin privileges - access granted');
            console.log('Step 17: Setting req.user with decoded token data');
            
            // Attach user data to request object for next middleware/controller
            req.user = {
                id: decoded.id,
                email: decoded.email,
                isAdmin: decoded.isAdmin,
                iat: decoded.iat,
                exp: decoded.exp
            };
            
            console.log('Step 18: req.user set with admin data:', {
                id: req.user.id,
                email: req.user.email,
                isAdmin: req.user.isAdmin
            });
            console.log('Step 19: Proceeding to next middleware or controller');
            
            next();
        } else {
            console.log('Step 20: User lacks admin privileges - returning 403 Forbidden');
            console.log('Step 21: Non-admin user ID:', decoded.id);
            console.log('Step 22: Non-admin user email:', decoded.email);
            res.status(403).json({ message: 'Forbidden' });
        }
    } catch (error) {
        console.log('Step 23: Token verification process failed');
        console.log('Step 24: Error type identification:', error.name);
        console.log('Step 25: Error message details:', error.message);
        console.log('Step 26: Failed token preview:', token ? token.substring(0, 30) + '...' : 'NULL');
        
        // Provide specific error information
        if (error.name === 'TokenExpiredError') {
            console.log('Step 27: Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            console.log('Step 28: Malformed token detected');
        } else if (error.name === 'NotBeforeError') {
            console.log('Step 29: Token not active yet');
        }
        
        console.log('Step 30: Returning 401 Invalid token');
        res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports = isAdmin;