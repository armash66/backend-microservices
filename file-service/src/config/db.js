const { Pool } = require('pg');
const { logger } = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle pg client');
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
