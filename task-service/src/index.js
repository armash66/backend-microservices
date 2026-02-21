const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// DB Models (Schema now managed by node-pg-migrate)
const taskModel = require('./models/taskModel');

const taskRoutes = require('./routes/taskRoutes');

const { connectRabbitMQ } = require('./events/rabbit');
connectRabbitMQ();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/tasks', taskRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'task-service' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Task Service running on port ${PORT}`);
});
