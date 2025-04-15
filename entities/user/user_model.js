const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');


async function modifyUsername(id_user, username) {
    const client = await getPool().connect();
    let res;
    try {
        res = await client.query('UPDATE "user" SET username = $1 WHERE id_user = $2', [username, id_user]);
    } catch (error) {
        console.error(error);
    } finally {
        client.release();
    }
    return res.rowCount > 0;
}

async function modifyEmail(id_user, email) {
    const client = await getPool().connect();
    let res;
    try {
        let email_lower = email.toLowerCase();
        res = await client.query('SELECT * FROM "user" WHERE email = $1', [email_lower]);
        if (res.rows.length > 0) {
            return false;
        }

        res = await client.query('UPDATE "user" SET email = $1 WHERE id_user = $2', [email_lower, id_user]);
    } catch (error) {
        console.error(error);
    } finally {
        client.release();
    }
    return true;
}

async function modifyPassword(id_user, password) {
    const client = await getPool().connect();
    let res;
    try {
        hashedPassword = await encrypt.hash(password);
        res = await client.query('UPDATE "user" SET password = $1 WHERE id_user = $2', [hashedPassword, id_user]);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
    return res.rowCount > 0;
}

async function saveResetToken(id_user) {
    const token = encrypt.generateToken();
    const expirationDate = new Date(Date.now() + 5 * 60 * 1000);
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE id_user = $1', [id_user]);
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        await client.query('INSERT INTO token (id_user, token, expire_at) VALUES ($1, $2, $3)', [id_user, token, expirationDate]);
    } catch (error) {
        console.error(error);
    } finally {
        client.release();
    }
    return token;
}

async function getInfo(token) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        const result = await client.query(`
            SELECT *
            FROM token t
            JOIN "user" u ON t.id_user = u.id_user
            WHERE t.token = $1 LIMIT 1`, [token]);
        return result.rowCount > 0 ? result.rows[0] : undefined;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function checkPassword(input_password, user_password) {
    const verify = await encrypt.check(input_password, user_password);
    return verify;
}

module.exports = {
    modifyUsername,
    modifyEmail,
    modifyPassword,
    saveResetToken,
    getInfo,
    checkPassword
};
