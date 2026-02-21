const taskModel = require('../models/taskModel');
const { logger } = require('../utils/logger');
const { getCache, setCache, invalidateCache } = require('../cache/redis');

const createTask = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.userId;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const newTask = await taskModel.createTask(userId, title, description);

        // Evict outdated cache
        await invalidateCache(`task:user:${userId}`);

        return res.status(201).json(newTask);
    } catch (error) {
        logger.error({ err: error }, 'Create Task Error');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getTasks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cacheKey = `task:user:${userId}`;

        // 1. Check Redis
        const cachedTasks = await getCache(cacheKey);
        if (cachedTasks) {
            return res.status(200).json(cachedTasks);
        }

        // 2. Fetch Truth
        const tasks = await taskModel.getTasksByUser(userId);

        // 3. Populate Redis
        await setCache(cacheKey, tasks, 60);

        return res.status(200).json(tasks);
    } catch (error) {
        logger.error({ err: error }, 'Get Tasks Error');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.userId;
        const { title, description, status } = req.body;

        const updatedTask = await taskModel.updateTask(taskId, userId, title, description, status);

        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found or not authorized' });
        }

        await invalidateCache(`task:user:${userId}`);

        return res.status(200).json(updatedTask);
    } catch (error) {
        logger.error({ err: error, taskId: req.params.id }, 'Update Task Error');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.userId;

        const deletedTask = await taskModel.deleteTask(taskId, userId);

        if (!deletedTask) {
            return res.status(404).json({ error: 'Task not found or not authorized' });
        }

        await invalidateCache(`task:user:${userId}`);

        return res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
    } catch (error) {
        logger.error({ err: error, taskId: req.params.id }, 'Delete Task Error');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};
