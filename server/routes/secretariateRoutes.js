const express = require('express');
const router = express.Router();
const secretariateController = require('../controllers/secretariateController');
const uploadSinglePhoto = require('../middleware/uploadPhoto');
const isAdmin = require('../middleware/isAdmin');

// Create a new secretariate
router.post('/', uploadSinglePhoto, isAdmin, secretariateController.createSecretariate);

// Read all secretariates
router.get('/', secretariateController.getAllSecretariates);

// Update secretariate positions in bulk
router.put('/positions', isAdmin, secretariateController.updateSecretariatePositions);

// Update a secretariate
router.put('/:id', uploadSinglePhoto, isAdmin, secretariateController.updateSecretariate);

// Delete a secretariate
router.delete('/:id', isAdmin, secretariateController.deleteSecretariate);

module.exports = router;