const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// DB Models (Schema now managed by node-pg-migrate)
const userModel = require('./models/userModel');

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});
