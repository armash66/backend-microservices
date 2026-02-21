const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { registerRules, loginRules, handleValidation } = require('../middleware/validate');

// POST /register
router.post('/register', registerRules, handleValidation, authController.register);

// POST /login
router.post('/login', loginRules, handleValidation, authController.login);

// DELETE /me
router.delete('/me', authMiddleware, authController.deleteAccount);

module.exports = router;
