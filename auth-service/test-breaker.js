require('dotenv').config({ path: './.env' });
const db = require('./src/config/db');
const fs = require('fs');

async function runTest() {
    let out = [];
    try {
        out.push("Testing Circuit Breaker DB query...");
        const result = await db.query('SELECT 1 as num', []);
        out.push("Result: " + JSON.stringify(result.rows));
    } catch (error) {
        out.push("Error occurred: " + error.message);
        out.push(error.stack);
    } finally {
        await db.closePool();
        fs.writeFileSync('output.txt', out.join('\n'));
    }
}

runTest();
