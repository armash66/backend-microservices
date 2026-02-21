const pino = require('pino');
const pinoHttp = require('pino-http');
const crypto = require('crypto');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: {
        service: 'api-gateway',
        instance: process.env.HOSTNAME
    }
});

const httpLogger = pinoHttp({
    logger,
    genReqId: (req) => {
        return req.headers['x-request-id'] || crypto.randomUUID();
    }
});

module.exports = { logger, httpLogger };
