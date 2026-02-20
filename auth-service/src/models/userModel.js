const db = require('../config/db');

const createUserTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        await db.query(queryText);
        console.log('Users table initialized');
    } catch (error) {
        console.error('Error creating users table:', error);
    }
};

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

module.exports = {
    createUserTable,
    createUser,
    getUserByEmail,
};
