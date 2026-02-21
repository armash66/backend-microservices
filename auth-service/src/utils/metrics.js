const promClient = require('prom-client');

const register = new promClient.Registry();

promClient.collectDefaultMetrics({
    app: 'auth-service',
    register
});

const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const eventPublishCounter = new promClient.Counter({
    name: 'events_published_total',
    help: 'Total number of events published to RabbitMQ',
    labelNames: ['routing_key']
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(eventPublishCounter);

const metricsMiddleware = (req, res, next) => {
    if (req.path === '/metrics' || req.path === '/health') return next();

    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        // req.route is populated by express if it matches a route
        const route = req.route ? req.route.path : req.path;
        end({ method: req.method, route: req.baseUrl + route, status_code: res.statusCode });
    });
    next();
};

module.exports = {
    register,
    metricsMiddleware,
    eventPublishCounter
};
