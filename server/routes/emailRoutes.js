const express = require('express');
const router = express.Router();
const emailService = require('../utils/emailService');
const { emailRateLimit } = require('../middleware/rateLimiter');

// send regular contact email
router.post('/', emailRateLimit, (req, res, next) => {
    console.log('🎯 EMAIL_ROUTES_DEBUG: Hitting regular contact email route');
    emailService.sendContactEmail(req, res, next);
});

module.exports = router;