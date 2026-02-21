const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Allow public auth routes to pass through without token
    if (req.path === '/auth/login' || req.path === '/auth/register' || req.path === '/auth/refresh') {
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
