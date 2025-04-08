const db = require('../../config/database/db');
const encrypt = require('../../utilities/encryption/encrypt');

async function modifyUser(pseudo, email, mdp) {
    try {
        return await db.clientConnect(async client => {
            return client.query("UPDATE utilisateur SET pseudo = $1, email = $2, mot_de_passe = $3 WHERE email = $4", [pseudo, email, mdp, email]);
        }, pseudo, email, mdp);
    } catch (error) {
        throw error;
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
