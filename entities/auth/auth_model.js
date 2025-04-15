const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');
const mail = require('../../services/mailer/mailer');

//#region Inscription

async function addUser(data) {
    const client = await getPool().connect();
    try {
        // Vérification email est déjà utilisé
        const emailUsed = await client.query('SELECT 1 FROM "user" WHERE email = $1 LIMIT 1', [data.email]).rowCount > 0;
        if (emailUsed) {
            data.emailUsed = true;
        }
        // Vérification id est déjà utilisé
        const idUsed = await client.query('SELECT 1 FROM "user" WHERE id_user = $1 LIMIT 1', [data.id_user]).rowCount > 0;
        if (idUsed) {
            data.idUsed = true;
        }

        if (emailUsed || idUsed) {
            return undefined;
        }
    
        // Ajoute l'utilisateur dans la db
        const { id_user, surname, name, birthdate, username, email, password } = userData;
        const hashedPassword = await encrypt.hash(password);
        const insertQuery = 'INSERT INTO "user" (id_user, surname, name, birthdate, username, email, password) VALUES ($1, $2, $3, $4, $5, $6, $7)';
        const dataList = [id_user, surname, name, birthdate, username, email, hashedPassword];
        await client.query(insertQuery, dataList);
    
        // Par sécurité, on retire les potentiels tokens 99.9% impossible
        await destroyOldIDToken(id_user, client);
    
        // On crée et retourne le token
        const duration = 24 * 60 * 60 * 1000; // = 24h
        return await createIDToken(user.id_user, duration, client);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}
//#endregioncreateIDToken

//#region Connexion

/**
 * Donnés un email et un mot de passe, regarde dans la db si un utilisateur y est associé.
 * @description connexion
 * @param {*} email 
 * @param {*} password 
 * @returns un tuple contenant les attributs de la table user ou undefined
 */
async function getUser(email, password) {
    const client = await getPool().connect();
    try {
        const query = await client.query('SELECT * FROM "user" WHERE email = $1 LIMIT 1', [email]);
        let user = undefined;
        if (query.rowCount > 0) {
            user = query.rows[0];
        }
    
        // Vérifie si un utilisateur est associé au mail
        if (user === undefined) {
            return undefined;
        }
        // Vérifie si le mot de passe spécifié est le bon
        if (!await encrypt.check(password, user.password)) {
            return undefined;
        }

        const userIdQuery = await client.query('SELECT token FROM token WHERE id_user = $1 LIMIT 1', [user.id_user]);
        if (userIdQuery.rowCount > 0) {
            return userIdQuery.rows[0].token;
        }

        const duration = 24 * 60 * 60 * 1000; // = 24h
        return await createIDToken(user.id_user, duration, client);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

//#endregion

//#region sendPasswordResetEmail

async function sendPasswordForgottenEmail(email) {
    const client = await getPool().connect();
    try {
        // Vérifie si l'email spécifié existe dans la db
        const result = await client.query('SELECT id_user FROM "user" WHERE email = $1 LIMIT 1', [data.email]);
        if (!result.rowCount > 0) {
            return;
        }
        const id_user = result.id_user;
        await destroyOldIDToken(id_user, client);

        // L'email expire après 5 minutes
        const duration = 5 * 60 * 1000; // = 5min
        await createIDToken(id_user, duration, client);
        await mail.transporter.sendMail({
            from: 'programmationwebprojet@gmail.com',
            to: email,
            subject: 'Réinitialisation de votre mot de passe',
            html: `<p>Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :</p>
                   <a href="http://localhost:8080/auth/mot_de_passe_reinitialisation?token=${token}">Réinitialiser mon mot de passe</a>`
        });
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

//#endregion

//#region passwordReset

//#endregion

//#region Tokens
async function createIDToken(id_user, durationInMS, client) {
    const token = encrypt.generateToken();
    const expirationDate = new Date(Date.now() + durationInMS);
    console.log(id_user, token, expirationDate);
    await client.query('INSERT INTO token (id_user, token, expire_at) VALUES ($1, $2, $3)', [id_user, token, expirationDate]);
    return token;
}

async function destroyOldIDToken(id_user, client) {
    await client.query('DELETE FROM token WHERE id_user = $1 OR expire_at < NOW()', [id_user]);
}

async function isIDTokenValid(token) {
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT 1 FROM token WHERE token = $1 AND expire_at > NOW() LIMIT 1', [token]);
        return result.rowCount > 0;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

//#endregion

//#region Réinitialisation mot de passe

async function updatePassword(token, password) {
    const client = await getPool().connect();
    try {
        const result = await client.query('SELECT id_user FROM token WHERE token = $1 LIMIT 1', [token]);
        if (res.rowCount < 1) {
            return false;
        }
        const id_user = result.rows[0].id_user;
        await destroyOldIDToken(id_user, client);
        const hashedPassword = await encrypt.hash(password);
        await client.query('UPDATE "user" SET password = $1 WHERE id_user = $2', [hashedPassword, id_user]);
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

//#endregion

module.exports = {
    addUser,
    getUser,
    sendPasswordForgottenEmail,
    isIDTokenValid,
    updatePassword
};
