const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');


async function modifyUsername(id_user, username) {
    const client = await getPool().connect();
    try {
        const res = await client.query('UPDATE "user" SET username = $1 WHERE id_user = $2', [username, id_user]);
        return res.rowCount > 0;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

async function modifyEmail(id_user, email) {
    const client = await getPool().connect();
    try {
        const email_lower = email.toLowerCase();
        const res = await client.query('SELECT * FROM "user" WHERE email = $1', [email_lower]);
        if (res.rows.length > 0) {
            return false;
        }

        await client.query('UPDATE "user" SET email = $1 WHERE id_user = $2', [email_lower, id_user]);
        return true;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

async function modifyPassword(id_user, password) {
    const client = await getPool().connect();
    try {
        const hashedPassword = await encrypt.hash(password);
        const res = await client.query('UPDATE "user" SET password = $1 WHERE id_user = $2', [hashedPassword, id_user]);
        return res.rowCount > 0;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

async function saveResetToken(id_user) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE id_user = $1', [id_user]);
        await client.query('DELETE FROM token WHERE expire_at < NOW()');

        const token = encrypt.generateToken();
        const expirationDate = new Date(Date.now() + 5 * 60 * 1000);
        await client.query('INSERT INTO token (id_user, token, expire_at) VALUES ($1, $2, $3)', [id_user, token, expirationDate]);
        return token;
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}

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
        throw err;
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
