const { Pool } = require('pg');
const { logger } = require('../utils/logger');
const { createBreaker } = require('../utils/breaker');

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

const queryWrapper = async (text, params) => {
    return pool.query(text, params);
};

const dbBreaker = createBreaker(queryWrapper, 'Task-PostgresDB');

module.exports = {
    query: (text, params) => dbBreaker.fire(text, params),
    closePool
};
