const request = require('supertest');
const app = require('../src/index');

// Mock dependencies so tests don't need real DB/RabbitMQ
jest.mock('../src/config/db', () => ({
    query: jest.fn(),
    closePool: jest.fn()
}));

jest.mock('../src/events/rabbit', () => ({
    connectRabbitMQ: jest.fn(),
    closeRabbitMQ: jest.fn(),
    publishEvent: jest.fn()
}));

const db = require('../src/config/db');
const { publishEvent } = require('../src/events/rabbit');
const bcrypt = require('bcryptjs');

describe('Auth Service - Registration', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should register a new user successfully', async () => {
        // No existing user
        db.query.mockResolvedValueOnce({ rows: [] });
        // Insert returns new user
        db.query.mockResolvedValueOnce({
            rows: [{ id: 1, email: 'test@example.com', created_at: new Date().toISOString() }]
        });

        const res = await request(app)
            .post('/register')
            .send({ email: 'test@example.com', password: 'pass123' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe('test@example.com');
    });

    it('should reject registration with existing email', async () => {
        db.query.mockResolvedValueOnce({
            rows: [{ id: 1, email: 'test@example.com' }]
        });

        const res = await request(app)
            .post('/register')
            .send({ email: 'test@example.com', password: 'pass123' });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email format', async () => {
        const res = await request(app)
            .post('/register')
            .send({ email: 'not-an-email', password: 'pass123' });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Validation failed');
    });

    it('should reject registration with short password', async () => {
        const res = await request(app)
            .post('/register')
            .send({ email: 'test@example.com', password: 'ab1' });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
    });

    it('should reject registration with password missing a number', async () => {
        const res = await request(app)
            .post('/register')
            .send({ email: 'test@example.com', password: 'abcdef' });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);
    });
});

describe('Auth Service - Login', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should login successfully with valid credentials', async () => {
        const hashed = await bcrypt.hash('pass123', 10);
        db.query.mockResolvedValueOnce({
            rows: [{ id: 1, email: 'test@example.com', password: hashed }]
        });

        const res = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'pass123' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
        const hashed = await bcrypt.hash('pass123', 10);
        db.query.mockResolvedValueOnce({
            rows: [{ id: 1, email: 'test@example.com', password: hashed }]
        });

        const res = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'wrongpass1' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
        db.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
            .post('/login')
            .send({ email: 'nobody@example.com', password: 'pass123' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});

describe('Auth Service - Refresh Token', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should issue a new access token with valid refresh token', async () => {
        // First login to get a refresh token
        const hashed = await bcrypt.hash('pass123', 10);
        db.query.mockResolvedValueOnce({
            rows: [{ id: 1, email: 'test@example.com', password: hashed }]
        });

        const loginRes = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'pass123' });

        const { refreshToken } = loginRes.body.data;

        const res = await request(app)
            .post('/refresh')
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
        const res = await request(app)
            .post('/refresh')
            .send({ refreshToken: 'invalid.token.here' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });
});

describe('Auth Service - Delete Account', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should delete account with valid token', async () => {
        // Login first
        const hashed = await bcrypt.hash('pass123', 10);
        db.query.mockResolvedValueOnce({
            rows: [{ id: 1, email: 'test@example.com', password: hashed }]
        });

        const loginRes = await request(app)
            .post('/login')
            .send({ email: 'test@example.com', password: 'pass123' });

        const token = loginRes.body.data.token;

        // Mock delete returning the user
        db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
        publishEvent.mockResolvedValueOnce();

        const res = await request(app)
            .delete('/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(publishEvent).toHaveBeenCalledWith('user.deleted', { userId: 1 });
    });

    it('should reject delete without token', async () => {
        const res = await request(app).delete('/me');

        expect(res.status).toBe(401);
    });
});
