const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const verifyToken = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All file routes require authentication
router.use(verifyToken);

// Upload a generic single file labeled 'document'
router.post('/upload', upload.single('document'), fileController.uploadFile);

// Get list of user's files
router.get('/', fileController.getUserFiles);

// Download a specific file
router.get('/download/:id', fileController.downloadFile);

// Delete a specific file
router.delete('/:id', fileController.deleteFile);

module.exports = router;
