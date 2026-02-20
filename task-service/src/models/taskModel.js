const db = require('../config/db');

const createTaskTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        await db.query(queryText);
        console.log('Tasks table initialized');
    } catch (error) {
        console.error('Error creating tasks table:', error);
    }
};

const createTask = async (userId, title, description) => {
    const queryText = `
    INSERT INTO tasks(user_id, title, description)
    VALUES($1, $2, $3)
    RETURNING *
  `;
    const result = await db.query(queryText, [userId, title, description]);
    return result.rows[0];
};

const getTasksByUser = async (userId) => {
    const queryText = 'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await db.query(queryText, [userId]);
    return result.rows;
};

const updateTask = async (taskId, userId, title, description, status) => {
    const queryText = `
    UPDATE tasks 
    SET title = COALESCE($1, title), 
        description = COALESCE($2, description), 
        status = COALESCE($3, status)
    WHERE id = $4 AND user_id = $5
    RETURNING *
  `;
    const result = await db.query(queryText, [title, description, status, taskId, userId]);
    return result.rows[0];
};

const deleteTask = async (taskId, userId) => {
    const queryText = 'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await db.query(queryText, [taskId, userId]);
    return result.rows[0];
};

module.exports = {
    createTaskTable,
    createTask,
    getTasksByUser,
    updateTask,
    deleteTask,
};
