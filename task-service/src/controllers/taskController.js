const taskModel = require('../models/taskModel');

const createTask = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.userId;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const newTask = await taskModel.createTask(userId, title, description);
        return res.status(201).json(newTask);
    } catch (error) {
        console.error('Create Task Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getTasks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const tasks = await taskModel.getTasksByUser(userId);
        return res.status(200).json(tasks);
    } catch (error) {
        console.error('Get Tasks Error:', error);
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

        return res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Update Task Error:', error);
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

        return res.status(200).json({ message: 'Task deleted successfully', task: deletedTask });
    } catch (error) {
        console.error('Delete Task Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTask,
    deleteTask
};
