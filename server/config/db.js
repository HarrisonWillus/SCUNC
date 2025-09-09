require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = process.env.NODE_ENV === 'production' ? {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 6543, // Transaction pooler port
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
        require: true,
        rejectUnauthorized: false
    },
    // Optimized for production with 200 max connections
    max: 25,  // Increased from 10
    min: 3,   // Keep minimum connections alive
    idleTimeoutMillis: 20000,  // Reduced for faster cleanup
    connectionTimeoutMillis: 8000,
    acquireTimeoutMillis: 8000,
    createTimeoutMillis: 8000,
    destroyTimeoutMillis: 3000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
} : {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432, // Direct connection for dev
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    },
    // Conservative for development
    max: 8,   // Smaller for local development
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    acquireTimeoutMillis: 10000,
    createTimeoutMillis: 10000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
};

const pool = new Pool(poolConfig);

// Enhanced error handling
pool.on('error', (err, client) => {
    console.error('🔥 Unexpected error on idle client:', err.message);
    console.error('🔥 Error code:', err.code);
});

pool.on('connect', (client) => {
    console.log('🔗 New client connected to pool');
});

pool.on('acquire', (client) => {
    console.log('📥 Client acquired from pool');
});

pool.on('remove', (client) => {
    console.log('📤 Client removed from pool');
});

// Test connection with detailed info
pool.connect()
    .then((client) => {
        console.log('✅ Connected to Supabase PostgreSQL');
        console.log('📊 Environment:', process.env.NODE_ENV || 'development');
        console.log('📊 Pool configuration:', {
            max: poolConfig.max,
            min: poolConfig.min,
            port: poolConfig.port,
            ssl_required: process.env.NODE_ENV === 'production'
        });
        console.log('📊 Current pool stats:', {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
        });
        client.release();
    })
    .catch((err) => {
        console.error('🔥 Database connection failed:');
        console.error('🔥 Error:', err.message);
        console.error('🔥 Code:', err.code);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Gracefully shutting down database pool...');
    await pool.end();
    console.log('✅ Database pool closed');
    process.exit(0);
});

module.exports = pool;