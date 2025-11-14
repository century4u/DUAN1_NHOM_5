const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');

// Routes
router.get('/', tourController.getAllTours);
router.get('/category/:category', tourController.getToursByCategory);
router.get('/:id', tourController.getTourById);
router.post('/', tourController.createTour);
router.put('/:id', tourController.updateTour);
router.delete('/:id', tourController.deleteTour);

module.exports = router;

