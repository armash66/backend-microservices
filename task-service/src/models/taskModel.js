const db = require('../config/db');


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

const deleteTasksByUser = async (userId) => {
    const queryText = 'DELETE FROM tasks WHERE user_id = $1 RETURNING *';
    const result = await db.query(queryText, [userId]);
    return result.rows;
};

module.exports = {
    createTask,
    getTasksByUser,
    updateTask,
    deleteTask,
    deleteTasksByUser
};
