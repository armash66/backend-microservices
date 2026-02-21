const fileModel = require('../models/fileModel');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

const uploadFile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Please upload a file' });
        }

        // Save metadata to DB
        const savedFile = await fileModel.saveFileMetadata(
            userId,
            file.originalname,
            file.filename,
            file.mimetype,
            file.size
        );

        return res.status(201).json({
            message: 'File uploaded successfully',
            file: savedFile
        });
    } catch (error) {
        logger.error({ err: error }, 'File Upload Error');
        return res.status(500).json({ error: 'Internal server error during upload' });
    }
};

const getUserFiles = async (req, res) => {
    try {
        const userId = req.user.userId;
        const files = await fileModel.getFilesByUser(userId);
        return res.status(200).json(files);
    } catch (error) {
        logger.error({ err: error }, 'Get Files Error');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const downloadFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.userId;

        // Check if file exists and belongs to user
        const fileRecord = await fileModel.getFileByIdAndUser(fileId, userId);

        if (!fileRecord) {
            return res.status(404).json({ error: 'File not found or unauthorized access' });
        }

        const filePath = path.join(__dirname, '../../uploads', fileRecord.file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File no longer exists on disk' });
        }

        res.download(filePath, fileRecord.original_name);
    } catch (error) {
        logger.error({ err: error, fileId: req.params.id }, 'Download File Error');
        return res.status(500).json({ error: 'Internal server error during download' });
    }
};

const deleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.userId;

        const fileRecord = await fileModel.getFileByIdAndUser(fileId, userId);
        if (!fileRecord) {
            return res.status(404).json({ error: 'File not found or unauthorized access' });
        }

        const filePath = path.join(__dirname, '../../uploads', fileRecord.file_path);

        // Delete from disk
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete metadata
        await fileModel.deleteFileMetadata(fileId, userId);

        return res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        logger.error({ err: error, fileId: req.params.id }, 'Delete File Error');
        return res.status(500).json({ error: 'Internal server error during delete' });
    }
};

module.exports = {
    uploadFile,
    getUserFiles,
    downloadFile,
    deleteFile
};
