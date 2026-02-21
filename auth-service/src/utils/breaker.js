const CircuitBreaker = require('opossum');
const { logger } = require('./logger');

const breakerOptions = {
    timeout: 3000,            // If action takes > 3000ms, fail
    errorThresholdPercentage: 50, // When 50% of requests fail, open circuit
    resetTimeout: 10000       // Try again after 10000ms
};

const createBreaker = (asyncFn, name) => {
    const breaker = new CircuitBreaker(asyncFn, breakerOptions);

    breaker.fallback(() => {
        logger.error({ circuit: name }, `Circuit Breaker FALLBACK triggered for ${name}`);
        throw new Error(`Service degraded. ${name} is currently unavailable.`);
    });

    breaker.on('open', () => logger.warn({ circuit: name }, `Circuit Breaker OPENED for ${name}`));
    breaker.on('halfOpen', () => logger.info({ circuit: name }, `Circuit Breaker HALF-OPEN for ${name}`));
    breaker.on('close', () => logger.info({ circuit: name }, `Circuit Breaker CLOSED for ${name}`));

    return {
        fire: (...args) => breaker.fire(...args)
    };
};

module.exports = { createBreaker };
