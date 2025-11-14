const express = require('express');
const router = express.Router();
const tourVersionController = require('../controllers/tourVersionController');

// Routes
router.get('/', tourVersionController.getAllVersions);
router.get('/tour/:tourId', tourVersionController.getVersionsByTour);
router.post('/calculate-price', tourVersionController.calculatePrice);
router.get('/:id', tourVersionController.getVersionById);
router.post('/', tourVersionController.createVersion);
router.put('/:id', tourVersionController.updateVersion);
router.delete('/:id', tourVersionController.deleteVersion);

module.exports = router;

