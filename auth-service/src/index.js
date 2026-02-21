const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// DB Models (Schema now managed by node-pg-migrate)
const userModel = require('./models/userModel');

const authRoutes = require('./routes/authRoutes');

const { connectRabbitMQ } = require('./events/rabbit');
connectRabbitMQ();

const { logger, httpLogger } = require('./utils/logger');
const { register, metricsMiddleware } = require('./utils/metrics');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(httpLogger);
app.use(metricsMiddleware);
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'auth-service' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info(`Auth Service running on port ${PORT}`);
    });
}

module.exports = app;
