const request = require('supertest');
const app = require('../src/index');

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

describe('Task Service Health Checks', () => {
    it('should return 200 on /health/live', async () => {
        const res = await request(app).get('/health/live');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('live');
        expect(res.body.service).toBe('task-service');
    });

    it('should return 200 on /health/ready', async () => {
        const res = await request(app).get('/health/ready');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ready');
    });
});
