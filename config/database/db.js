require('dotenv').config();
const path = require('path');
const fs = require('fs');
const pg = require('pg');

let pool;

async function initDatabase() {
    const config = getDbConfig();
    pool = new pg.Pool(config);
    await pool.query('SELECT NOW()');
    console.log(`Base de donnée '${config.database}' de '${config.user}' chargée !`);
}

function getDbConfig() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
    };
    return config;
}

module.exports = {
    getPool: () => pool, 
    initDatabase };
