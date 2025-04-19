const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');

async function getUsername(token) {
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT username FROM "user" WHERE user_id = (SELECT user_id FROM token WHERE token = $1 LIMIT 1)', [token]);
        return result.rows[0].username;
    } catch (error) {
        console.error(error);
    } finally {
        client.release();
    }
}

async function modifyUsername(user_id, username) {
    const client = await getPool().connect();
    try {
        await client.query('UPDATE "user" SET username = $1 WHERE user_id = $2', [username, user_id]);
    } catch (error) {
        console.error(error);
    } finally {
        client.release();
    }
}

async function modifyEmail(user_id, email) {
    const client = await getPool().connect();
    try {
        const email_lower = email.toLowerCase();
        let res = await client.query('SELECT * FROM "user" WHERE email = $1', [email_lower]);
        if (res.rows.length > 0) {
            return false;
        }

        res = await client.query('UPDATE "user" SET email = $1 WHERE user_id = $2', [email_lower, user_id]);
        return true;
    } catch (error) {
        console.error(error);
    } finally {
        client.release();
    }
}

async function modifyPassword(user_id, password) {
    const client = await getPool().connect();
    try {
        hashedPassword = await encrypt.hash(password);
        await client.query('UPDATE "user" SET password = $1 WHERE user_id = $2', [hashedPassword, user_id]);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

async function saveResetToken(user_id) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE user_id = $1', [user_id]);
        await client.query('DELETE FROM token WHERE expire_at < NOW()');

        const token = encrypt.generateToken();
        const expirationDate = new Date(Date.now() + 5 * 60 * 1000);
        await client.query('INSERT INTO token (user_id, token, expire_at) VALUES ($1, $2, $3)', [user_id, token, expirationDate]);
        return token;
    } catch (error) {
        console.error(error);
    } finally {
        client.release();
    }
}

async function getUserInfoWithToken(token) {
    const client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        const result = await client.query(`
            SELECT *
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

async function getPeopleInfoWithId(user_id) {
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT * FROM "user" WHERE user_id = $1', [user_id]);
        return result.rows[0];
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

async function updateProfilePicture(token, filePath) {
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT user_id FROM token WHERE token = $1 LIMIT 1', [token]);
        if (result.rowCount < 1) {
            return false;
        }

        const user_id = result.rows[0].user_id;
        await client.query('UPDATE "user" SET profilepicture = $1 WHERE user_id = $2', [filePath, user_id]);
        return true;
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}


module.exports = {
    getUsername,
    modifyUsername,
    modifyEmail,
    modifyPassword,
    saveResetToken,
    getUserInfoWithToken,
    getPeopleInfoWithId,
    checkPassword,
    updateProfilePicture
};
