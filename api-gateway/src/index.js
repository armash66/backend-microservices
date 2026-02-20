const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup CORS and Logging
app.use(cors());
app.use(morgan('dev'));

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
        // Error handling if a downstream service is down
        onError: (err, req, res) => {
            console.error(`Error communicating with ${route} service:`, err.message);
            res.status(502).json({ error: 'Bad Gateway - Service is down' });
        }
    }));
}

// Global 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'API Gateway: Route not found' });
});

// Start Gateway
app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
