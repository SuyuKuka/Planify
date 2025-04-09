const db = require('../../services/database/db');
const encrypt = require('../../services/encryption/encrypt');

async function modifyUser(username, email, password, old_email, new_password) {
    let client = await db.pool.connect();
    try {
        let exist = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
        if (exist.rows.length > 0) {
            return 1;
        }

        let check = await client.query("SELECT * FROM utilisateur WHERE email = $1 AND password = $2", [old_email, password]);
        if (check.rows.length === 0) {
            return 2;
        } else {
            let res = await client.query("UPDATE utilisateur SET username = $1, email = $2, password = $3 WHERE email = $4", [username, email, new_password, old_email]);
            return 0;
        }

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

module.exports = { modifyUser, saveResetToken };
