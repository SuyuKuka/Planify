const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');

// TODO: changer session_username par token
async function modifyUsername(session_username, username) {
    const client = await getPool().connect();
    let res;
    try {
        res = await client.query("UPDATE utilisateur SET username = $1 WHERE username = $2", [username, session_username]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return res.rowCount > 0;
}

// TODO: changer session_username par token
async function modifyEmail(session_username, email) {
    const client = await getPool().connect();
    let res;
    try {
        res = await client.query("UPDATE utilisateur SET email = $1 WHERE username = $2", [email, session_username]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return res.rowCount > 0;
}

// TODO: changer session_username par token
async function modifyPassword(session_username, password) {
    const client = await getPool().connect();
    let res;
    try {
        hashedPassword = await encrypt.hashPassword(password);
        res = await client.query("UPDATE utilisateur SET password = $1 WHERE username = $2", [hashedPassword, session_username]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return res.rowCount > 0;
}

async function saveResetToken(email) {
    const token = encrypt.generateToken();
    const expirationDate = new Date(Date.now() + 5 * 60 * 1000);
    const client = await getPool().connect();
    try {
        await client.query("DELETE FROM token WHERE email = $1", [email]);
        await client.query("DELETE FROM token WHERE expire_at < NOW()");
        await client.query("INSERT INTO token (email, token, expire_at) VALUES ($1, $2, $3)", [email, token, expirationDate]);
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
    return token;
}

module.exports = {
    modifyUsername,
    modifyEmail,
    modifyPassword,
    saveResetToken
};
