const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');
const isAdmin = require('../middleware/isAdmin');

// GET /api/quotes - Get all quotes
router.get('/', quoteController.getAllQuotes);

// GET /api/quotes/person/:person_id - Get quotes by secretariate person_id
router.get('/person/:person_id', quoteController.getQuotesByPersonId);

// POST /api/quotes - Add a new quote (admin only)
router.post('/', isAdmin, quoteController.addQuote);

// PUT /api/quotes/:id - Update a quote (admin only)
router.put('/:id', isAdmin, quoteController.updateQuote);

// DELETE /api/quotes/:id - Delete a quote (admin only)
router.delete('/:id', isAdmin, quoteController.deleteQuote);

module.exports = router;
