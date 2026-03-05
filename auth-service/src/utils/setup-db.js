const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function setup() {
    const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;

    // Connect to 'postgres' default database first to create our target database
    const client = new Client({
        user: DB_USER,
        password: DB_PASSWORD,
        host: DB_HOST,
        port: DB_PORT,
        database: 'postgres'
    });

    try {
        await client.connect();

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);

        if (res.rowCount === 0) {
            console.log(`Creating database ${DB_NAME}...`);
            await client.query(`CREATE DATABASE ${DB_NAME}`);
            console.log('Database created successfully.');
        } else {
            console.log(`Database ${DB_NAME} already exists.`);
        }
    } catch (err) {
        console.error('Error setting up database:', err.message);
        console.log('\nTIP: Make sure your PostgreSQL credentials in auth-service/.env are correct.');
    } finally {
        await client.end();
    }
}

setup();
