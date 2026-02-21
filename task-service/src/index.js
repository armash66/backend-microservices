const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// DB Models (Schema now managed by node-pg-migrate)
const taskModel = require('./models/taskModel');

const taskRoutes = require('./routes/taskRoutes');

const { connectRabbitMQ, closeRabbitMQ } = require('./events/rabbit');
connectRabbitMQ();

const { closePool } = require('./config/db');
const { redis } = require('./cache/redis');

const { logger, httpLogger } = require('./utils/logger');
const { register, metricsMiddleware } = require('./utils/metrics');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(httpLogger);
app.use(metricsMiddleware);
app.use(cors());
app.use(express.json());

// Routes
app.use(taskRoutes);

// Health checks
app.get('/health/live', (req, res) => res.status(200).json({ status: 'live', service: 'task-service' }));
app.get('/health/ready', (req, res) => {
    // A robust app checks Redis, DB and Rabbit configs here
    res.status(200).json({ status: 'ready', service: 'task-service' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Start Server
let server;
if (require.main === module) {
    server = app.listen(PORT, () => {
        logger.info(`Task Service running on port ${PORT}`);
    });
}

// Graceful Shutdown
const shutdown = async () => {
    logger.info('Task Service received shutdown signal.');
    if (server) {
        server.close(() => logger.info('Express server closed.'));
    }
    try {
        await closeRabbitMQ();
        await closePool();
        if (redis) redis.quit();
    } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
    }
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
