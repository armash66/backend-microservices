// Standardized API response helpers

const success = (res, data, statusCode = 200, message = 'Success') => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const created = (res, data, message = 'Resource created') => {
    return success(res, data, 201, message);
};

const error = (res, statusCode = 500, message = 'Internal server error', details = null) => {
    const response = {
        success: false,
        error: message
    };
    if (details) response.details = details;
    return res.status(statusCode).json(response);
};

module.exports = { success, created, error };
