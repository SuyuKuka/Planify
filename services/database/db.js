const path = require('path');
const fs = require('fs');
const pg = require('pg');

const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'planify',
    password: getDBPassword(),
    port: 5432
});

function getDBPassword() {
    try {
        return fs.readFileSync(path.join(__dirname, 'password.txt'), 'utf8').trim();
    } catch (err) {
        return "";
    }
}

module.exports = { pool };
