const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { publishEvent } = require('../events/rabbit');

const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user exists
        const existingUser = await userModel.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save user
        const newUser = await userModel.createUser(email, hashedPassword);

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                created_at: newUser.created_at
            }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await userModel.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT Payload
        const payload = {
            userId: user.id,
            email: user.email,
        };

        // Sign Token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({
            message: 'Login successful',
            token
        });

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.userId; // Provided by authMiddleware locally

        const deletedUser = await userModel.deleteUserById(userId);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Emit the domain event
        await publishEvent('user.deleted', { userId });

        return res.status(200).json({ message: 'Account deleted out successfully' });
    } catch (error) {
        console.error('Delete Account Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    deleteAccount
};
