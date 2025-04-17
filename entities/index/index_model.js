const { getPool } = require('../../config/database/db');

async function getInfo(token) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        const result = await client.query(`
            SELECT u.username, u.email
            FROM token t
            JOIN "user" u ON t.user_id = u.user_id
            WHERE t.token = $1 LIMIT 1`, [token]);
        return result.rowCount > 0 ? result.rows[0] : undefined;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function prefixSearch(user_id, email) {
    const client = await getPool().connect();
    try {
        const user_id_query = user_id + "%";
        const email_query = email + "%";
        const res = await client.query('SELECT * FROM "user" WHERE user_id LIKE $1 OR email LIKE $2', [user_id_query, email_query]);
        return res.rows;
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { getInfo, prefixSearch };
