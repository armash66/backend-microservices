const jwt = require('jsonwebtoken');

const PUBLIC_PATHS = [
    '/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh',
    '/auth/login', '/auth/register', '/auth/refresh'
];

const verifyToken = (req, res, next) => {
    // Allow public auth routes to pass through without token
    if (PUBLIC_PATHS.includes(req.path)) {
        return next();
    }

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'API Gateway: Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Token is valid, let it pass to the underlying microservice
        // The underlying services will decode it again if needed, or we could pass headers
        next();
    } catch (error) {
        return res.status(403).json({ error: 'API Gateway: Invalid or expired token.' });
    }
};

module.exports = verifyToken;
