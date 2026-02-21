const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { publishEvent } = require('../events/rabbit');
const { logger } = require('../utils/logger');
const res_helper = require('../utils/response');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const existingUser = await userModel.getUserByEmail(email);
        if (existingUser) {
            return res_helper.error(res, 409, 'Email already registered');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save user
        const newUser = await userModel.createUser(email, hashedPassword);

        return res_helper.created(res, {
            id: newUser.id,
            email: newUser.email,
            created_at: newUser.created_at
        }, 'User registered successfully');

    } catch (err) {
        logger.error({ err }, 'Registration Error');
        return res_helper.error(res, 500, 'Internal server error');
    }
};

const generateTokens = (payload) => {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await userModel.getUserByEmail(email);
        if (!user) {
            return res_helper.error(res, 401, 'Invalid credentials');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res_helper.error(res, 401, 'Invalid credentials');
        }

        const payload = { userId: user.id, email: user.email };
        const { accessToken, refreshToken } = generateTokens(payload);

        return res_helper.success(res, {
            token: accessToken,
            refreshToken
        }, 200, 'Login successful');

    } catch (err) {
        logger.error({ err }, 'Login Error');
        return res_helper.error(res, 500, 'Internal server error');
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res_helper.error(res, 400, 'Refresh token is required');
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const payload = { userId: decoded.userId, email: decoded.email };
        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

        return res_helper.success(res, { token: newAccessToken }, 200, 'Token refreshed');
    } catch (err) {
        logger.warn({ err }, 'Refresh token invalid or expired');
        return res_helper.error(res, 403, 'Invalid or expired refresh token');
    }
};

const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.userId;

        const deletedUser = await userModel.deleteUserById(userId);

        if (!deletedUser) {
            return res_helper.error(res, 404, 'User not found');
        }

        // Emit the domain event
        await publishEvent('user.deleted', { userId });

        return res_helper.success(res, null, 200, 'Account deleted successfully');
    } catch (err) {
        logger.error({ err, userId: req.user?.userId }, 'Delete Account Error');
        return res_helper.error(res, 500, 'Internal server error');
    }
};

module.exports = {
    register,
    login,
    refreshAccessToken,
    deleteAccount
};
