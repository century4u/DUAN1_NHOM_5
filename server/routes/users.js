const express = require('express');
const router = express.Router();

// Get all users
router.get('/', (req, res) => {
  res.json({ message: 'Get all users' });
});

// Get user by ID
router.get('/:id', (req, res) => {
  res.json({ message: 'Get user by ID', userId: req.params.id });
});

// Create user
router.post('/', (req, res) => {
  res.json({ message: 'Create user' });
});

// Update user
router.put('/:id', (req, res) => {
  res.json({ message: 'Update user', userId: req.params.id });
});

// Delete user
router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete user', userId: req.params.id });
});

module.exports = router;
