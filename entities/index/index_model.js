const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');

async function getInfo(token) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        
        const id_user = await client.query('SELECT * FROM token WHERE token = $1', [token]);
        if (id_user.rows.length > 0) {
            const res = await client.query('SELECT * FROM "user" WHERE id_user = $1', [id_user.rows[0].id_user]);
            return res.rows[0];
        } else {
            return undefined;
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

module.exports = { getInfo };
