const db = require('../../services/database/db');
const encrypt = require('../../services/encryption/encrypt');

// TODO: changer session_username par token
async function modifyUsername(session_username, username) {
    const client = await db.pool.connect();
    try {
        const res = await client.query("UPDATE utilisateur SET username = $1 WHERE username = $2", [username, session_username]);
        return res.rowCount > 0;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

// TODO: changer session_username par token
async function modifyEmail(session_username, email) {
    const client = await db.pool.connect();
    try {
        const res = await client.query("UPDATE utilisateur SET email = $1 WHERE username = $2", [email, session_username]);
        return res.rowCount > 0;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

// TODO: changer session_username par token
async function modifyPassword(session_username, password) {
    const client = await db.pool.connect();
    try {
        const res = await client.query("UPDATE utilisateur SET password = $1 WHERE username = $2", [password, session_username]);
        return res.rowCount > 0;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

async function saveResetToken(email) {
    try {
        let token = encrypt.generateToken();
        let expirationDate = new Date(Date.now() + 5 * 60 * 1000); 
    
        return await db.clientConnect(async client => {
            client.query("DELETE FROM token WHERE email = $1", [email]);
            client.query("DELETE FROM token WHERE expire_at < NOW()");
            client.query(
                "INSERT INTO token (email, token, expire_at) VALUES ($1, $2, $3)",
                [email, token, expirationDate]);
            return token;
        }, email, token, expirationDate);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    modifyUsername,
    modifyEmail,
    modifyPassword,
    saveResetToken
};
