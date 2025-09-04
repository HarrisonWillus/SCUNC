const express = require('express');
const router = express.Router();
const committeeController = require('../controllers/committeeController');
const isAdmin = require('../middleware/isAdmin');
const uploadSinglePhoto = require('../middleware/uploadPhoto');

// Public routes (with API key validation)
router.get('/', committeeController.getAllCommittees);
router.get('/category', committeeController.getCategories);

// Protected routes (require admin authentication)
router.post('/', uploadSinglePhoto, isAdmin, committeeController.createCommittee);
router.put('/:id', uploadSinglePhoto, isAdmin, committeeController.updateCommittee);
router.delete('/:id', isAdmin, committeeController.deleteCommittee);
router.post('/category', isAdmin, committeeController.createCategory);

module.exports = router;
