const db = require('../config/db');

const createFileTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100),
      size BIGINT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        await db.query(queryText);
        console.log('Files table initialized');
    } catch (error) {
        console.error('Error creating files table:', error);
    }
};

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

module.exports = {
    createFileTable,
    saveFileMetadata,
    getFileByIdAndUser,
    getFilesByUser,
    deleteFileMetadata
};
