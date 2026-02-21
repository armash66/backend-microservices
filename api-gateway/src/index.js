const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logger, httpLogger } = require('./utils/logger');
const { register, metricsMiddleware } = require('./utils/metrics');

dotenv.config();

const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Security Headers
app.use(helmet());

// Setup Rate Limiting (Global limit to prevent DDoS or brute force)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'API Gateway: Too many requests from this IP, please try again later.' }
});
app.use(limiter);

// Strict limit for login route to prevent credential stuffing/brute force
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'API Gateway: Too many login attempts from this IP, please try again later.' }
});
app.use('/auth/login', loginLimiter);

// Setup CORS and Logging
app.use(cors({
    origin: "http://localhost:3000", // Update with your actual frontend URL later
    credentials: true
}));
app.use(httpLogger);
app.use(metricsMiddleware);

// Setup global JWT validation (Requirement: "Validate JWT before forwarding")
// We apply this to all incoming proxy requests.
app.use(authMiddleware);

// Define Gateway Proxy Routes
const services = {
    '/auth': process.env.AUTH_SERVICE_URL,
    '/tasks': process.env.TASK_SERVICE_URL,
    '/files': process.env.FILE_SERVICE_URL,
};

// Mount proxies
for (const [route, target] of Object.entries(services)) {
    app.use(route, createProxyMiddleware({
        target,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
            if (req.id) {
                proxyReq.setHeader('x-request-id', req.id);
            }
        },
        // Error handling if a downstream service is down
        onError: (err, req, res) => {
            logger.error(`Error communicating with ${route} service: ${err.message}`);
            res.status(502).json({ error: 'Bad Gateway - Service is down' });
        }
    }));
}

// Global Metrics probe
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Global 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'API Gateway: Route not found' });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    logger.error({ err }, 'Gateway Error');
    res.status(err.status || 500).json({
        error: 'API Gateway: Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Gateway
app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
});
