require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = process.env.NODE_ENV === 'production' ? {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    pool_mode: process.env.POOL_MODE,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout
    acquireTimeoutMillis: 10000,
    createTimeoutMillis: 10000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
} : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 10000,
    createTimeoutMillis: 10000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
};

const pool = new Pool(poolConfig);

// Add error handling
pool.on('error', (err, client) => {
    console.error('🔥 Unexpected error on idle client', err);
});

pool.connect()
    .then(() => {
        console.log('✅ Connected to the database');
    })
    .catch((err) => {
        console.error('🔥 Error connecting to the database:', err);
    });

module.exports = pool;