const db = require('../config/db');


const saveFileMetadata = async (userId, originalName, filePath, mimeType, size) => {
    const queryText = `
    INSERT INTO files(user_id, original_name, file_path, mime_type, size)
    VALUES($1, $2, $3, $4, $5)
    RETURNING *
  `;
    const result = await db.query(queryText, [userId, originalName, filePath, mimeType, size]);
    return result.rows[0];
};

const getFileByIdAndUser = async (fileId, userId) => {
    const queryText = 'SELECT * FROM files WHERE id = $1 AND user_id = $2';
    const result = await db.query(queryText, [fileId, userId]);
    return result.rows[0];
};

const getFilesByUser = async (userId) => {
    const queryText = 'SELECT * FROM files WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await db.query(queryText, [userId]);
    return result.rows;
};

const deleteFileMetadata = async (fileId, userId) => {
    const queryText = 'DELETE FROM files WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await db.query(queryText, [fileId, userId]);
    return result.rows[0];
};

const deleteFilesByUser = async (userId) => {
    const queryText = 'DELETE FROM files WHERE user_id = $1 RETURNING file_path';
    const result = await db.query(queryText, [userId]);
    return result.rows;     // We return the rows to grab the physical file paths, so we can clean disk too
};

module.exports = {
    saveFileMetadata,
    getFileByIdAndUser,
    getFilesByUser,
    deleteFileMetadata,
    deleteFilesByUser
};
