const { body, param, validationResult } = require('express-validator');

// Middleware to check validation results
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            error: 'Validation failed',
            details: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

// Validation rules for creating a task
const createTaskRules = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title must be under 255 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must be under 1000 characters'),
];

// Validation for task ID param
const taskIdRules = [
    param('id')
        .isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
];

module.exports = {
    handleValidation,
    createTaskRules,
    taskIdRules
};
