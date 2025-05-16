require('dotenv').config();
const pg = require('pg');

let pool;

async function initDatabase() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    };
    pool = new pg.Pool(config);
    await pool.query('SELECT NOW()');
    console.log(`Base de donnée '${config.database}' de '${config.user}' chargée !`);
}

module.exports = {
    initDatabase,
    getPool: () => pool
};
