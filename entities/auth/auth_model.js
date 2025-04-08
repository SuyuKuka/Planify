const db = require('../../services/database/db');

async function isEmailAlreadyUsed(email) {
    let client = await db.pool.connect();
    try {
        let res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
        return res.rowCount > 0;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

async function getUser(email, mdp) {
    const client = await db.pool.connect();
    try {
        const res = await client.query("SELECT * FROM utilisateur WHERE email = $1 AND password = $2", [email, mdp]);
        if (res.rows.length == 0) {
            return null;
        }
        return res.rows[0];
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

async function addUser(nom, prenom, date, pseudo, email, mdp) {
    const client = await db.pool.connect();
    try {
        let res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
        if (res.rows.length > 0) {
            return false;
        }
        await client.query("INSERT INTO utilisateur (nom, prenom, date_de_naissance, pseudo, email, mot_de_passe) VALUES ($1, $2, $3, $4, $5, $6)", [nom, prenom, date, pseudo, email, mdp]);
        return true;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

async function disconnectSession() {

}

async function sendPasswordForgottenEmail() {

}

module.exports = { isEmailAlreadyUsed, getUser, addUser, sendPasswordForgottenEmail };
