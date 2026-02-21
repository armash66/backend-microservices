const request = require('supertest');
const app = require('../src/index');

// A simple integration test checking if the app boots up properly
describe('Auth Service Internal Integration', () => {

    // We mock the RabbitMQ and DB connection for unit/integration isolation
    // if we don't want the tests instantly crashing without Postgres running locally.
    // However, since we're using real DB logic, this simple test just targets a harmless endpoint!

    it('Should correctly return 200 on the health probe', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('auth-service');
        expect(res.body.status).toBe('ok');
    });

    // In a real isolated environment without the Gateway, we could
    // write Supertest routes mimicking POST /auth/login locally here.
});
