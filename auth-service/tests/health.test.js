const request = require('supertest');
const app = require('../src/index');

jest.mock('../src/config/db', () => ({
    query: jest.fn(),
    closePool: jest.fn()
}));

jest.mock('../src/events/rabbit', () => ({
    connectRabbitMQ: jest.fn(),
    closeRabbitMQ: jest.fn(),
    publishEvent: jest.fn()
}));

describe('Auth Service Health Checks', () => {
    it('should return 200 on /health/live', async () => {
        const res = await request(app).get('/health/live');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('live');
        expect(res.body.service).toBe('auth-service');
    });

    it('should return 200 on /health/ready', async () => {
        const res = await request(app).get('/health/ready');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ready');
    });
});
