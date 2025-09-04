const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

// Route to check if token is still valid
router.post('/verifyToken', authController.verifyToken);

module.exports = router;