const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const verifyToken = require('../middleware/authMiddleware');
const { createTaskRules, taskIdRules, handleValidation } = require('../middleware/validate');

// All task routes require authentication
router.use(verifyToken);

router.post('/', createTaskRules, handleValidation, taskController.createTask);
router.get('/', taskController.getTasks);
router.put('/:id', taskIdRules, handleValidation, taskController.updateTask);
router.delete('/:id', taskIdRules, handleValidation, taskController.deleteTask);

module.exports = router;
