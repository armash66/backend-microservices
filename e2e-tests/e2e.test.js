const request = require('supertest');
const { Pool } = require('pg');

// We use the Gateway URL assuming `docker-compose up` is running.
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:3000';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/microservices'
});

describe('Distributed End-to-End Propagation Tests', () => {
    let userToken;
    let userId;

    afterAll(async () => {
        // Close DB connections after all tests are executed
        await pool.end();
    });

    it('1. Setup Registration/Login', async () => {
        const email = 'e2e-tester@example.com';
        const password = 'securepassword123';

        // Attempt to register
        let res = await request(GATEWAY_URL).post('/auth/register').send({ email, password });

        // Login to acquire the JWT token
        res = await request(GATEWAY_URL).post('/auth/login').send({ email, password });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();

        userToken = res.body.token;

        // Decode the JWT Payload manually to retrieve the assigned userId
        const payloadStr = Buffer.from(userToken.split('.')[1], 'base64').toString();
        const payload = JSON.parse(payloadStr);
        userId = payload.userId;
        expect(userId).toBeDefined();
    });

    it('2. Should create a Task associated with the user', async () => {
        const res = await request(GATEWAY_URL)
            .post('/tasks')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                title: 'Integration Core Test Task',
                description: 'Verifying async propagation via message broker'
            });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Integration Core Test Task');
    });

    // We could technically simulate a file upload as well, but this involves a multipart stream
    // which requires a physical file path. We'll verify tasks and users.

    it('3. Should verify the Task exists directly in the PostgreSQL Database', async () => {
        const tasksRes = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
        expect(tasksRes.rows.length).toBeGreaterThan(0);
        expect(tasksRes.rows[0].title).toBe('Integration Core Test Task');
    });

    it('4. Should completely DELETE the user account via API Gateway (Publishes user.deleted)', async () => {
        const res = await request(GATEWAY_URL)
            .delete('/auth/me')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
    });

    it('5. Eventual Consistency: Wait for RabbitMQ Event Propagation to clear dependent records', async () => {
        // Wait 3000ms to allow RabbitMQ to transport the 'user.deleted' event
        // to the task-service, and for the task-service to ack the db deletion.
        await new Promise(resolve => setTimeout(resolve, 3000));

        const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        expect(userRes.rows.length).toBe(0);

        const tasksRes = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
        // Critical Distributed Systems Assertion: Tasks should be gone!
        expect(tasksRes.rows.length).toBe(0);
    }, 10000); // Expanding default test timeout given the sleep delay
});
