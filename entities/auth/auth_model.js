const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');
const mail = require('../../services/mailer/mailer');

async function isEmailAlreadyUsed(email) {
    let client = await getPool().connect();
    let res;
    try {
        res = await client.query('SELECT * FROM "user" WHERE email = $1', [email]);
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
        res = await client.query('SELECT * FROM "user" WHERE email = $1', [email]);
        if (res.rows.length === 0) { // Si y'a pas de user avec cet email
            return undefined;
        } else if (res.rows.length > 1) { // Si y'a plus d'un user avec cet email
            await client.query('DELETE FROM "user" WHERE email = $1', [email]);
            return undefined;
        }

        const verify = await encrypt.check(password, res.rows[0].password);
        if (!verify) {
            return undefined;
        }
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return res.rows[0];
}

async function addUser(id_user, surname, name, birthdate, username, email, password) {
    const client = await getPool().connect();
    try {
        let id = id_user.toLowerCase();
        let res = await client.query('SELECT * FROM "user" WHERE id_user = $1', [id]);

        if (res.rows.length > 0) {
            return false;
        }

        let hashedPassword = await encrypt.hash(password);
        client.query('INSERT INTO "user" (id_user, surname, name, birthdate, username, email, password) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, surname, name, birthdate, username, email, hashedPassword]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return true;
}

async function saveResetToken(id_user) {
    let token = encrypt.generateToken();
    let expirationDate = new Date(Date.now() + 5 * 60 * 1000); 

    let client = await getPool().connect();
    try {
        await client.query('DELETE FROM token WHERE id_user = $1', [id_user]);
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        await client.query('INSERT INTO token (id_user, token, expire_at) VALUES ($1, $2, $3)', [id_user, token, expirationDate]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return token;
}

async function sendPasswordForgottenEmail(email) {
    let client = await getPool().connect();
    let result = await client.query('SELECT * FROM "user" WHERE email = $1', [email]);
    client.release();

    if (result.rows.length > 0) {
        try {
            let token = await saveResetToken(result.rows[0].id_user);
            await mail.transporter.sendMail({
                from: 'programmationwebprojet@gmail.com',
                to: email,
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
        result = await client.query('SELECT * FROM token WHERE token = $1 AND expire_at > NOW()', [token]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return result;
}

async function updatePassword(id_user, password) {
    let client = await getPool().connect();
    try {
        let hashedPassword = await encrypt.hash(password);
        await client.query('UPDATE "user" SET password = $1 WHERE id_user = $2', [hashedPassword, id_user]);

        await client.query('DELETE FROM token WHERE id_user = $1', [id_user]);
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return true;
}

async function addIDtoToken(id_user) {
    let client = await getPool().connect();
    let token;
    try {
        await client.query('DELETE FROM token WHERE id_user = $1', [id_user]);
        await client.query('DELETE FROM token WHERE expire_at < NOW()');

        let id = id_user.toLowerCase();
        token = encrypt.generateToken();
        let expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await client.query('INSERT INTO token (id_user, token, expire_at) VALUES ($1, $2, $3)', [id, token, expirationDate]);
    } catch (err) {
        throw err;
    } finally {
        client.release();
    }
    return token;
}

module.exports = {
    isEmailAlreadyUsed,
    getUser,
    addUser,
    sendPasswordForgottenEmail,
    checkToken,
    updatePassword,
    addIDtoToken
};
