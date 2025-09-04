const rateLimit = require('express-rate-limit');

// Rate limiter for registration form - 5 attempts per 15 minutes per IP
const registerRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many registration attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
});

// Rate limiter for email endpoints - 3 emails per 10 minutes per IP
const emailRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // limit each IP to 3 email requests per windowMs
    message: {
        error: 'Too many email attempts from this IP, please try again after 10 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: true, // Skip failed requests so people aren't penalized for validation errors
});

module.exports = {
    registerRateLimit,
    emailRateLimit
};