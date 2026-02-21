const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/index');

// Mock all external dependencies
jest.mock('../src/config/db', () => ({
    query: jest.fn(),
    closePool: jest.fn()
}));

jest.mock('../src/events/rabbit', () => ({
    connectRabbitMQ: jest.fn(),
    closeRabbitMQ: jest.fn(),
    consumeEvent: jest.fn()
}));

jest.mock('../src/cache/redis', () => ({
    redis: null,
    getCache: jest.fn().mockResolvedValue(null),
    setCache: jest.fn().mockResolvedValue(true),
    invalidateCache: jest.fn().mockResolvedValue(true)
}));

const db = require('../src/config/db');
const { getCache } = require('../src/cache/redis');

// Generate a valid JWT for authenticated requests
const SECRET = process.env.JWT_SECRET || 'supersecret_auth_key_123';
const validToken = jwt.sign({ userId: 1, email: 'test@example.com' }, SECRET, { expiresIn: '1h' });

describe('Task Service - Create Task', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should create a task successfully', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{ id: 1, user_id: 1, title: 'Test Task', description: 'Desc', status: 'pending', created_at: new Date().toISOString() }]
        });

        const res = await request(app)
            .post('/')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ title: 'Test Task', description: 'Desc' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Test Task');
    });

    it('should reject task creation without title', async () => {
        const res = await request(app)
            .post('/')
            .set('Authorization', `Bearer ${validToken}`)
            .send({ description: 'No title' });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should reject task creation without auth token', async () => {
        const res = await request(app)
            .post('/')
            .send({ title: 'Test', description: 'Desc' });

        expect(res.status).toBe(401);
    });
});

describe('Task Service - Get Tasks', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should return tasks from database when cache is empty', async () => {
        getCache.mockResolvedValueOnce(null);
        db.query.mockResolvedValueOnce({
            rows: [
                { id: 1, title: 'Task 1', description: 'A', status: 'pending' },
                { id: 2, title: 'Task 2', description: 'B', status: 'done' }
            ]
        });

        const res = await request(app)
            .get('/')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(2);
    });

    it('should return tasks from cache when available', async () => {
        const cachedTasks = [{ id: 1, title: 'Cached Task' }];
        getCache.mockResolvedValueOnce(cachedTasks);

        const res = await request(app)
            .get('/')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual(cachedTasks);
        // DB should NOT have been called
        expect(db.query).not.toHaveBeenCalled();
    });

    it('should reject without auth token', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(401);
    });
});

describe('Task Service - Delete Task', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should delete a task successfully', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{ id: 1, title: 'Deleted task' }]
        });

        const res = await request(app)
            .delete('/1')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent task', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .delete('/999')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it('should reject invalid task ID', async () => {
        const res = await request(app)
            .delete('/abc')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.status).toBe(422);
    });
});

describe('Task Service - Health Checks', () => {
    it('should return 200 on /health/live', async () => {
        const res = await request(app).get('/health/live');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('live');
    });

    it('should return 200 on /health/ready', async () => {
        const res = await request(app).get('/health/ready');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ready');
    });
});
