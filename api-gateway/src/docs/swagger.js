const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Backend Microservices API',
            version: '1.0.0',
            description: 'Production-grade microservices API with auth, tasks, and file management',
            contact: {
                name: 'Armash Ansari',
                url: 'https://github.com/armash66/backend-microservices'
            }
        },
        servers: [
            { url: '/v1', description: 'API v1' },
            { url: '/', description: 'Legacy (unversioned)' }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Task: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        user_id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Build microservice' },
                        description: { type: 'string', example: 'Implement auth service' },
                        status: { type: 'string', enum: ['pending', 'in_progress', 'done'], example: 'pending' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string' },
                        data: { type: 'object' }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string' }
                    }
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example: 'Validation failed' },
                        details: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        },
        paths: {
            '/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Register a new user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                                        password: { type: 'string', minLength: 6, example: 'secure123' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'User registered successfully', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
                        '409': { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
                        '422': { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } } }
                    }
                }
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login and get JWT tokens',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email' },
                                        password: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Login successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: true },
                                            message: { type: 'string', example: 'Login successful' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    token: { type: 'string', description: 'Access token (15min)' },
                                                    refreshToken: { type: 'string', description: 'Refresh token (7 days)' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '401': { description: 'Invalid credentials' }
                    }
                }
            },
            '/auth/refresh': {
                post: {
                    tags: ['Auth'],
                    summary: 'Refresh access token',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['refreshToken'],
                                    properties: {
                                        refreshToken: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Token refreshed' },
                        '403': { description: 'Invalid or expired refresh token' }
                    }
                }
            },
            '/auth/me': {
                delete: {
                    tags: ['Auth'],
                    summary: 'Delete current user account',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        '200': { description: 'Account deleted' },
                        '401': { description: 'No token provided' },
                        '404': { description: 'User not found' }
                    }
                }
            },
            '/tasks': {
                get: {
                    tags: ['Tasks'],
                    summary: 'Get all tasks for authenticated user',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        '200': {
                            description: 'Tasks retrieved',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            data: { type: 'array', items: { $ref: '#/components/schemas/Task' } }
                                        }
                                    }
                                }
                            }
                        },
                        '401': { description: 'Unauthorized' }
                    }
                },
                post: {
                    tags: ['Tasks'],
                    summary: 'Create a new task',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['title'],
                                    properties: {
                                        title: { type: 'string', maxLength: 255, example: 'Build microservice' },
                                        description: { type: 'string', maxLength: 1000, example: 'Implement the auth service' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'Task created' },
                        '401': { description: 'Unauthorized' },
                        '422': { description: 'Validation failed' }
                    }
                }
            },
            '/tasks/{id}': {
                put: {
                    tags: ['Tasks'],
                    summary: 'Update a task',
                    security: [{ BearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        title: { type: 'string' },
                                        description: { type: 'string' },
                                        status: { type: 'string', enum: ['pending', 'in_progress', 'done'] }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': { description: 'Task updated' },
                        '404': { description: 'Task not found' }
                    }
                },
                delete: {
                    tags: ['Tasks'],
                    summary: 'Delete a task',
                    security: [{ BearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: {
                        '200': { description: 'Task deleted' },
                        '404': { description: 'Task not found' }
                    }
                }
            },
            '/files/upload': {
                post: {
                    tags: ['Files'],
                    summary: 'Upload a file',
                    security: [{ BearerAuth: [] }],
                    requestBody: {
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        file: { type: 'string', format: 'binary' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': { description: 'File uploaded' },
                        '401': { description: 'Unauthorized' }
                    }
                }
            },
            '/files': {
                get: {
                    tags: ['Files'],
                    summary: 'Get all files for authenticated user',
                    security: [{ BearerAuth: [] }],
                    responses: {
                        '200': { description: 'Files retrieved' },
                        '401': { description: 'Unauthorized' }
                    }
                }
            },
            '/files/{id}': {
                get: {
                    tags: ['Files'],
                    summary: 'Download a file by ID',
                    security: [{ BearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: {
                        '200': { description: 'File downloaded' },
                        '404': { description: 'File not found' }
                    }
                },
                delete: {
                    tags: ['Files'],
                    summary: 'Delete a file',
                    security: [{ BearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                    responses: {
                        '200': { description: 'File deleted' },
                        '404': { description: 'File not found' }
                    }
                }
            }
        }
    },
    apis: []
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
