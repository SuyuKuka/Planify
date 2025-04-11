const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');
const mail = require('../../services/mailer/mailer');

async function isEmailAlreadyUsed(email) {
    let client = await getPool().connect();
    try {
        let res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
        return res.rowCount > 0;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

async function getUser(email, password) {
    const client = await getPool().connect();
    try {
        const res = await client.query("SELECT * FROM utilisateur WHERE email = $1 AND password = $2", [email, password]);
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

async function addUser(surname, name, birthdate, username, email, password) {
    const client = await getPool().connect();
    try {
        let res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
        if (res.rows.length > 0) {
            return false;
        }
        client.query("INSERT INTO utilisateur (surname, name, birthdate, username, email, password) VALUES ($1, $2, $3, $4, $5, $6)", [surname, name, birthdate, username, email, password]);
        return true;
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
}

async function saveResetToken(email) {
    let token = encrypt.generateToken();
    let expirationDate = new Date(Date.now() + 5 * 60 * 1000); 

    let client = await getPool().connect();
    try {
        await client.query("DELETE FROM token WHERE email = $1", [email]);
        await client.query("DELETE FROM token WHERE expire_at < NOW()");
        await client.query("INSERT INTO token (email, token, expire_at) VALUES ($1, $2, $3)", [email, token, expirationDate]);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
    return token;
}

async function sendPasswordForgottenEmail(email_oublie) {
    let client = await getPool().connect();
    let result = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email_oublie]);
    client.release();

    if (result.rows.length > 0) {
        try {
            let token = await saveResetToken(email_oublie);
            await mail.transporter.sendMail({
                from: 'programmationwebprojet@gmail.com',
                to: email_oublie,
                subject: 'Réinitialisation de votre mot de passe',
                html: `<p>Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :</p>
                       <a href="http://localhost:8080/auth/mdp_reinitialisation?token=${token}">Réinitialiser mon mot de passe</a>`
            });
        } catch (error) {
            console.error(error);
        }
    }
}

async function checkToken(token) {
    let client = await getPool().connect();
    try {
        let result = await client.query("SELECT * FROM token WHERE token = $1 AND expire_at > NOW()", [token]);
        return result;
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

async function updatePassword(email, password) {
    let client = await getPool().connect();
    try {
        await client.query("UPDATE utilisateur SET password = $1 WHERE email = $2", [password, email]);
        await client.query("DELETE FROM token WHERE email = $1", [email]);
        await client.query("DELETE FROM token WHERE expire_at < NOW()");
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

module.exports = {
    isEmailAlreadyUsed,
    getUser,
    addUser,
    sendPasswordForgottenEmail,
    checkToken,
    updatePassword
};
