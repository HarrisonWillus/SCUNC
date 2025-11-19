// In middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const registerRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        error: 'Too many registration attempts, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    // ✅ Add this for better proxy handling
    trustProxy: true, // Always trust proxy since you use it in development too
    // Debug function
    handler: (req, res) => {
        console.log('Step 1: Registration rate limit threshold exceeded');
        console.log('Step 2: Client IP address identification:', req.ip);
        console.log('Step 3: X-Forwarded-For header analysis:', req.headers['x-forwarded-for']);
        console.log('Step 4: User-Agent string examination:', req.headers['user-agent']);
        console.log('Step 5: Request path verification:', req.path);
        res.status(429).json({
            error: 'Too many registration attempts, please try again after 15 minutes.'
        });
    }
});

const emailRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3,
    message: {
        error: 'Too many email attempts, please try again after 10 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
    // ✅ Add this for better proxy handling
    trustProxy: true, // Always trust proxy since you use it in development too
    // Debug function
    handler: (req, res) => {
        console.log('Step 1: Email rate limit threshold exceeded');
        console.log('Step 2: Client IP address identification:', req.ip);
        console.log('Step 3: User-Agent string examination:', req.headers['user-agent']);
        console.log('Step 4: Request body content analysis:', req.body);
        res.status(429).json({
            error: 'Too many email attempts, please try again after 10 minutes.'
        });
    }
});

module.exports = {
    registerRateLimit,
    emailRateLimit
};