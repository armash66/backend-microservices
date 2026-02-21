const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// DB Models (Schema now managed by node-pg-migrate)
const fileModel = require('./models/fileModel');

const fileRoutes = require('./routes/fileRoutes');

const { connectRabbitMQ, closeRabbitMQ } = require('./events/rabbit');
connectRabbitMQ();

const { closePool } = require('./config/db');

const { logger, httpLogger } = require('./utils/logger');
const { register, metricsMiddleware } = require('./utils/metrics');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(httpLogger);
app.use(metricsMiddleware);
app.use(cors());
app.use(express.json());

// Routes
app.use('/files', fileRoutes);

// Health checks
app.get('/health/live', (req, res) => res.status(200).json({ status: 'live', service: 'file-service' }));
app.get('/health/ready', (req, res) => res.status(200).json({ status: 'ready', service: 'file-service' }));

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Start Server
let server;
if (require.main === module) {
    server = app.listen(PORT, () => {
        logger.info(`File Service running on port ${PORT}`);
    });
}

// Graceful Shutdown
const shutdown = async () => {
    logger.info('File Service received shutdown signal.');
    if (server) {
        server.close(() => logger.info('Express server closed.'));
    }
    try {
        await closeRabbitMQ();
        await closePool();
    } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
    }
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
