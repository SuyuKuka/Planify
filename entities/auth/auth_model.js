const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');
const mail = require('../../services/mailer/mailer');

async function isEmailAlreadyUsed(email) {
    let client = await getPool().connect();
    let res;
    try {
        res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return res.rowCount > 0;
}

async function getUser(email, password) {
    const client = await getPool().connect();
    let res;
    try {
        res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
        if (res.rows.length == 0) {
            return null;
        }

        const verify = await encrypt.checkPassword(password, res.rows[0].password);
        if (!verify) {
            return null;
        }
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return res.rows[0];
}

async function addUser(surname, name, birthdate, username, email, password) {
    const client = await getPool().connect();
    try {
        let res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
        if (res.rows.length > 0) {
            return false;
        }

        let hashedPassword = await encrypt.hashPassword(password);
        client.query("INSERT INTO utilisateur (surname, name, birthdate, username, email, password) VALUES ($1, $2, $3, $4, $5, $6)", [surname, name, birthdate, username, email, hashedPassword]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return true;
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
        throw err;
    } finally {
        client.release();
    }
    return token;
}

async function sendPasswordForgottenEmail(email_forgotten) {
    let client = await getPool().connect();
    let result = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email_forgotten]);
    client.release();

    if (result.rows.length > 0) {
        try {
            let token = await saveResetToken(email_forgotten);
            await mail.transporter.sendMail({
                from: 'programmationwebprojet@gmail.com',
                to: email_forgotten,
                subject: 'Réinitialisation de votre mot de passe',
                html: `<p>Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :</p>
                       <a href="http://localhost:8080/auth/mot_de_passe_reinitialisation?token=${token}">Réinitialiser mon mot de passe</a>`
            });
        } catch (error) {
            throw error;
        }
    }
}

async function checkToken(token) {
    let client = await getPool().connect();
    let result;
    try {
        result = await client.query("SELECT * FROM token WHERE token = $1 AND expire_at > NOW()", [token]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return result;
}

async function updatePassword(email, password) {
    let client = await getPool().connect();
    try {
        let hashedPassword = await encrypt.hashPassword(password);
        await client.query("UPDATE utilisateur SET password = $1 WHERE email = $2", [hashedPassword, email]);
        await client.query("DELETE FROM token WHERE email = $1", [email]);
        await client.query("DELETE FROM token WHERE expire_at < NOW()");
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return true;
}

module.exports = {
    isEmailAlreadyUsed,
    getUser,
    addUser,
    sendPasswordForgottenEmail,
    checkToken,
    updatePassword
};
