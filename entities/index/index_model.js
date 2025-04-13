const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');

async function getInfo(token) {
    const client = await getPool().connect();
    let res;
    try {
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        let id_user = await client.query('SELECT * FROM token WHERE token = $1', [token]);
        if (id_user.rows.length > 0) {
            res = await client.query('SELECT * FROM "user" WHERE id_user = $1', [id_user.rows[0].id_user]);
        } else {
            return undefined;
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
    return res.rows[0];
}

module.exports = { getInfo };
