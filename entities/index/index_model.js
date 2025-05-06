const { getPool } = require('../../config/database/db');

async function getInfo(token) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        const result = await client.query(`
            SELECT u.user_id, u.username, u.email
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

// async function getIDWithEmail(email) {
//     const client = await getPool().connect();
//     try {
//         const res = await client.query('SELECT user_id FROM "user" WHERE email = $1', [email]);
//         console.log(res.rows[0]);
//         return res.rows[0].user_id;
//     } catch (error) {
//         throw error;
//     } finally {
//         client.release();
//     }
// }

async function createReunion(name, date, time, participants, user_id, email) {
    const client = await getPool().connect();
    try {
        const insertResult = await client.query(
            'INSERT INTO reunion (user_id, name, date, time) VALUES ($1, $2, $3, $4) RETURNING id',
            [user_id, name, date, time]
        );

        const reunion_id = insertResult.rows[0].id;

        await client.query(
            'INSERT INTO participants (reunion_id, email) VALUES ($1, $2)',
            [reunion_id, email]
        );

        for (let index = 0; index < participants.length; index++) {
            await client.query(
                'INSERT INTO participants (reunion_id, email) VALUES ($1, $2)',
                [reunion_id, participants[index]]
            );
        }
    } catch (error) {
        if (error.code === '23505') { 
            return -1;
        } else {
            throw error;
        }
    } finally {
        client.release();
    }
}


module.exports = { getInfo, prefixSearch, createReunion };
