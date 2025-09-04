const express = require('express');
const multer = require('multer');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const isAdmin = require('../middleware/isAdmin');
const { registerRateLimit } = require('../middleware/rateLimiter');

// Configure multer for form data (no file uploads, just form fields)
const upload = multer();

// Get all schools (with JSON parsing)
router.get('/', express.json(), isAdmin, schoolController.getAllSchools);

// Register a new school (with FormData support)
router.post('/register', upload.none(), registerRateLimit, schoolController.registerSchool);

// Get registration status (no body parsing needed)
router.get('/status', schoolController.getRegistrationStatus);

// Change registration status (with JSON parsing)
router.put('/status', express.json(), isAdmin, schoolController.changeRegistrationStatus);

// Delete a school (with JSON parsing)
router.delete('/:id', express.json(), isAdmin, schoolController.deleteSchool);

module.exports = router;
