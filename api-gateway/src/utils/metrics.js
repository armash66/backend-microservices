const promClient = require('prom-client');

// Initialize the default registry
const register = new promClient.Registry();

// Enable default metrics (CPU, Memory, Event LoopLag, etc.)
promClient.collectDefaultMetrics({
    app: 'api-gateway',
    register
});

const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to automatically track HTTP duration metrics
const metricsMiddleware = (req, res, next) => {
    // Only track actual business routes, skip /metrics to avoid polluting our own monitoring
    if (req.path === '/metrics') {
        return next();
    }

    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        end({
            method: req.method,
            route: req.baseUrl + req.path,
            status_code: res.statusCode
        });
    });
    next();
};

module.exports = {
    register,
    metricsMiddleware
};
