require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runTest() {
    try {
        console.log("Direct PG query...");
        const result = await pool.query('SELECT 1 as num', []);
        console.log("Result:", result.rows);
    } catch (error) {
        console.log("DIRECT DB ERROR:", error.message);
    } finally {
        await pool.end();
    }
}

runTest();
