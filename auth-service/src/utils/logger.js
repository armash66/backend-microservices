const pino = require('pino');
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'auth-service' }
});

const httpLogger = pinoHttp({
    logger,
    genReqId: (req) => {
        return req.headers['x-request-id'] || uuidv4();
    }
});

module.exports = { logger, httpLogger };
