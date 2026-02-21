const db = require('../config/db');


const createUser = async (email, hashedPassword) => {
    const queryText = 'INSERT INTO users(email, password) VALUES($1, $2) RETURNING id, email, created_at';
    const result = await db.query(queryText, [email, hashedPassword]);
    return result.rows[0];
};

const getUserByEmail = async (email) => {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(queryText, [email]);
    return result.rows[0];
};

const deleteUserById = async (userId) => {
    const queryText = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await db.query(queryText, [userId]);
    return result.rows[0];
};

module.exports = {
    createUser,
    getUserByEmail,
    deleteUserById
};
