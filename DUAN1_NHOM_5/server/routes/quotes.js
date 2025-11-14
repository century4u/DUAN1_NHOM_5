const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

// Routes
router.get('/', quoteController.getAllQuotes);
router.post('/calculate', quoteController.quickCalculate);
router.get('/:id', quoteController.getQuoteById);
router.post('/', quoteController.createQuote);
router.post('/:id/send-email', quoteController.sendQuoteEmail);
router.post('/:id/send-zalo', quoteController.sendQuoteZalo);
router.put('/:id', quoteController.updateQuote);
router.delete('/:id', quoteController.deleteQuote);

module.exports = router;

