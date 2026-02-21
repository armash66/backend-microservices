const taskModel = require('../models/taskModel');
const { logger } = require('../utils/logger');
const { getCache, setCache, invalidateCache } = require('../cache/redis');
const res_helper = require('../utils/response');

const createTask = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.userId;

        const newTask = await taskModel.createTask(userId, title, description);

        // Evict outdated cache
        await invalidateCache(`task:user:${userId}`);

        return res_helper.created(res, newTask, 'Task created successfully');
    } catch (err) {
        logger.error({ err }, 'Create Task Error');
        return res_helper.error(res, 500, 'Internal server error');
    }
};

const getTasks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cacheKey = `task:user:${userId}`;

        // 1. Check Redis
        const cachedTasks = await getCache(cacheKey);
        if (cachedTasks) {
            return res_helper.success(res, cachedTasks, 200, 'Tasks retrieved (cached)');
        }

        // 2. Fetch Truth
        const tasks = await taskModel.getTasksByUser(userId);

        // 3. Populate Redis
        await setCache(cacheKey, tasks, 60);

        return res_helper.success(res, tasks, 200, 'Tasks retrieved');
    } catch (err) {
        logger.error({ err }, 'Get Tasks Error');
        return res_helper.error(res, 500, 'Internal server error');
    }
};

const updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.userId;
        const { title, description, status } = req.body;

        const updatedTask = await taskModel.updateTask(taskId, userId, title, description, status);

        if (!updatedTask) {
            return res_helper.error(res, 404, 'Task not found or not authorized');
        }

        await invalidateCache(`task:user:${userId}`);

        return res_helper.success(res, updatedTask, 200, 'Task updated successfully');
    } catch (err) {
        logger.error({ err, taskId: req.params.id }, 'Update Task Error');
        return res_helper.error(res, 500, 'Internal server error');
    }
};

const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.userId;

        const deletedTask = await taskModel.deleteTask(taskId, userId);

        if (!deletedTask) {
            return res_helper.error(res, 404, 'Task not found or not authorized');
        }

        await invalidateCache(`task:user:${userId}`);

        return res_helper.success(res, deletedTask, 200, 'Task deleted successfully');
    } catch (err) {
        logger.error({ err, taskId: req.params.id }, 'Delete Task Error');
        return res_helper.error(res, 500, 'Internal server error');
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};
