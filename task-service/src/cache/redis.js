const Redis = require('ioredis');
const { logger } = require('../utils/logger');

// Initialize Redis directly targeting the docker-compose hostname
// If REDIS_URL isn't set (e.g., running raw locally), it falls back to standard localhost mapping
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

redis.on('connect', () => {
    logger.info('Connected to Redis Cache');
});

redis.on('error', (err) => {
    logger.error({ err }, 'Redis Connection Error');
});

// A standard helper function to keep TTL centralized across the microservice
const setCache = async (key, value, ttlSeconds = 60) => {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        logger.info({ key, action: 'SET' }, 'Cache successfully populated');
    } catch (error) {
        // We log, but we don't crash. Cache is an optimization layer, not a failure point.
        logger.error({ err: error, key }, 'Failed to set cache block');
    }
};

const getCache = async (key) => {
    try {
        const data = await redis.get(key);
        if (data) {
            logger.info({ key, action: 'HIT' }, 'Cache returned data directly');
            return JSON.parse(data);
        }
        logger.info({ key, action: 'MISS' }, 'Cache miss - Routing to truth DB');
        return null;
    } catch (error) {
        logger.error({ err: error, key }, 'Failed to retrieve cache block');
        return null;
    }
};

const invalidateCache = async (key) => {
    try {
        await redis.del(key);
        logger.info({ key, action: 'INVALIDATE' }, 'Cache record wiped');
    } catch (error) {
        logger.error({ err: error, key }, 'Failed to invalidate cache block');
    }
};

module.exports = {
    redis,
    setCache,
    getCache,
    invalidateCache
};
