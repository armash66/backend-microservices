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

const { connectRabbitMQ } = require('./events/rabbit');
connectRabbitMQ();

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'file-service' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`File Service running on port ${PORT}`);
    });
}

module.exports = app;
