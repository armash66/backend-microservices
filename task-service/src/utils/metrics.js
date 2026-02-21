const promClient = require('prom-client');

const register = new promClient.Registry();

promClient.collectDefaultMetrics({
    app: 'task-service',
    register
});

const httpRequestDurationMicroseconds = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 5, 10]
});

const cacheHitsCounter = new promClient.Counter({
    name: 'cache_hits_total',
    help: 'Total number of Redis cache hits'
});

const cacheMissesCounter = new promClient.Counter({
    name: 'cache_misses_total',
    help: 'Total number of Redis cache misses'
});

const eventConsumeCounter = new promClient.Counter({
    name: 'events_consumed_total',
    help: 'Total number of RabbitMQ events naturally consumed',
    labelNames: ['routing_key']
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(cacheHitsCounter);
register.registerMetric(cacheMissesCounter);
register.registerMetric(eventConsumeCounter);

const metricsMiddleware = (req, res, next) => {
    if (req.path === '/metrics' || req.path === '/health') return next();

    const end = httpRequestDurationMicroseconds.startTimer();
    res.on('finish', () => {
        const route = req.route ? req.route.path : req.path;
        end({ method: req.method, route: req.baseUrl + route, status_code: res.statusCode });
    });
    next();
};

module.exports = {
    register,
    metricsMiddleware,
    cacheHitsCounter,
    cacheMissesCounter,
    eventConsumeCounter
};
