const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];

    // Format: Bearer <token>
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Add user from payload
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = verifyToken;
