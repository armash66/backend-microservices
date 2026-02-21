const fileModel = require('../models/fileModel');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');
const res_helper = require('../utils/response');

const uploadFile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const file = req.file;

        if (!file) {
            return res_helper.error(res, 400, 'Please upload a file');
        }

        // Save metadata to DB
        const savedFile = await fileModel.saveFileMetadata(
            userId,
            file.originalname,
            file.filename,
            file.mimetype,
            file.size
        );

        return res_helper.created(res, savedFile, 'File uploaded successfully');
    } catch (error) {
        logger.error({ err: error }, 'File Upload Error');
        return res_helper.error(res, 500, 'Internal server error during upload');
    }
};

const getUserFiles = async (req, res) => {
    try {
        const userId = req.user.userId;
        const files = await fileModel.getFilesByUser(userId);
        return res_helper.success(res, files, 200, 'Files retrieved successfully');
    } catch (error) {
        logger.error({ err: error }, 'Get Files Error');
        return res_helper.error(res, 500, 'Internal server error');
    }
};

const downloadFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.userId;

        // Check if file exists and belongs to user
        const fileRecord = await fileModel.getFileByIdAndUser(fileId, userId);

        if (!fileRecord) {
            return res_helper.error(res, 404, 'File not found or unauthorized access');
        }

        const filePath = path.join(__dirname, '../../uploads', fileRecord.file_path);

        if (!fs.existsSync(filePath)) {
            return res_helper.error(res, 404, 'File no longer exists on disk');
        }

        res.download(filePath, fileRecord.original_name);
    } catch (error) {
        logger.error({ err: error, fileId: req.params.id }, 'Download File Error');
        return res_helper.error(res, 500, 'Internal server error during download');
    }
};

const deleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const userId = req.user.userId;

        const fileRecord = await fileModel.getFileByIdAndUser(fileId, userId);
        if (!fileRecord) {
            return res_helper.error(res, 404, 'File not found or unauthorized access');
        }

        const filePath = path.join(__dirname, '../../uploads', fileRecord.file_path);

        // Delete from disk
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete metadata
        await fileModel.deleteFileMetadata(fileId, userId);

        return res_helper.success(res, null, 200, 'File deleted successfully');
    } catch (error) {
        logger.error({ err: error, fileId: req.params.id }, 'Delete File Error');
        return res_helper.error(res, 500, 'Internal server error during delete');
    }
};

module.exports = {
    uploadFile,
    getUserFiles,
    downloadFile,
    deleteFile
};
