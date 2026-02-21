const request = require('supertest');
const app = require('../src/index');

describe('Task Service Internal Integration', () => {
    it('Should correctly return 200 on the health probe', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('task-service');
        expect(res.body.status).toBe('ok');
    });
});
