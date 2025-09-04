const express = require('express');
const router = express.Router();
const emailService = require('../utils/emailService');
const { emailRateLimit } = require('../middleware/rateLimiter');

// send regular contact email
router.post('/', emailRateLimit, emailService.sendContactEmail);

// send business contact email
router.post('/business', emailRateLimit, emailService.sendBusinessEmail);

module.exports = router;