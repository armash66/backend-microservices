const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /auth/register
router.post('/register', authController.register);

// POST /auth/login
router.post('/login', authController.login);

// DELETE /auth/me
router.delete('/me', authMiddleware, authController.deleteAccount);

module.exports = router;
