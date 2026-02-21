const { Pool } = require('pg');
const { logger } = require('../utils/logger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle pg client');
    process.exit(-1);
});

const closePool = async () => {
    logger.info('Closing Postgres DB Pool.');
    await pool.end();
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    closePool
};
