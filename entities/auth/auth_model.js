const { getPool } = require('../../config/database/db');
const encrypt = require('../../services/encryption/encrypt');
const mail = require('../../services/mailer/mailer');

// Connexion (+ Inscription) 24h
const connectSessionDuration = 24 * 60 * 60 * 1000;
// Mail reset 5m
const resetSessionDuration = 5 * 60 * 1000;

//#region Inscription

/**
 * A l'inscription, à partir des données du formulaire, crée l'utilisateur si
 * l'email ou le nom d'utilisateur n'est pas déjà utilisé et renvoie un token
 * associé à l'utilisateur
 * @param {struct} data 
 * @returns undefined ou le token associé
 */
async function addUser(data) {
    const client = await getPool().connect();
    try {
        // Vérification email est déjà utilisé
        const emailUsed = (await client.query('SELECT 1 FROM "user" WHERE email = $1 LIMIT 1', [data.email])).rowCount > 0;
        if (emailUsed) {
            data.email = "";
            data.emailUsed = true;
        }
        // Vérification id est déjà utilisé
        const idUsed = (await client.query('SELECT 1 FROM "user" WHERE id_user = $1 LIMIT 1', [data.id_user])).rowCount > 0;
        if (idUsed) {
            data.id_user = "";
            data.idUsed = true;
        }

        if (emailUsed || idUsed) {
            return undefined;
        }
    
        // Ajoute l'utilisateur avec mot de passe crypté dans la db
        const { id_user, surname, name, birthdate, username, email, password } = data;
        const hashedPassword = await encrypt.hash(password);
        const insertQuery = 'INSERT INTO "user" (id_user, surname, name, birthdate, username, email, password) VALUES ($1, $2, $3, $4, $5, $6, $7)';
        const dataList = [id_user, surname, name, birthdate, username, email, hashedPassword];
        await client.query(insertQuery, dataList);
    
        // Par sécurité, on retire les potentiels tokens 99.9% impossible
        await destroyOldIDToken(id_user, client);
    
        // On crée et retourne le token associé à l'utilisateur
        return await createIDToken(id_user, connectSessionDuration, client);
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
 * A la connexion, à partir de l'email et du mot de passe, vérifie si un utilisateur
 * associé existe dans la base de donnée et si oui, renvoie un token associé.
 * @param {string} email 
 * @param {string} password 
 * @returns undefined ou le token associé
 */
async function getUser(email, password) {
    const client = await getPool().connect();
    try {
        const query = await client.query('SELECT * FROM "user" WHERE email = $1 LIMIT 1', [email]);
        // Vérifie si un utilisateur associé à l'email existe
        if (query.rowCount < 1) {
            return undefined;
        }

        const user = query.rows[0];

        // Vérifie si le mot de passe spécifié est le bon
        if (!await encrypt.check(password, user.password)) {
            return undefined;
        }

        // Si un token non expiré existe déjà, le renvoie
        const userIdQuery = await client.query('SELECT token FROM token WHERE id_user = $1 AND expire_at > NOW() LIMIT 1', [user.id_user]);
        if (userIdQuery.rowCount > 0) {
            return userIdQuery.rows[0].token;
        }

        // Sinon, en génère un nouveau et le renvoie
        return await createIDToken(user.id_user, connectSessionDuration, client);
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        client.release();
    }
}

//#endregion

//#region Réinitialisation mot de passe et Email

/**
 * Envoie un email de réinitialisation de mot de passe à l'adresse spécifié si elle existe.
 * @param {string} email 
 */
async function sendPasswordForgottenEmail(email) {
    const client = await getPool().connect();
    try {
        // Vérifie si l'email spécifié existe dans la db
        const result = await client.query('SELECT id_user FROM "user" WHERE email = $1 LIMIT 1', [data.email]);
        if (result.rowCount < 1) {
            return;
        }
        const id_user = result.id_user;
        await destroyOldIDToken(id_user, client);

        // L'email expire après 5 minutes
        await createIDToken(id_user, resetSessionDuration, client);
        // TODO: envoyer le mail depuis services/mailer ?
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

/**
 * A partir du token et d'un mot de passe donné, modifie le mot de passe de l'utilisateur
 * associé au token s'il existe.
 * @param {*} token 
 * @param {*} password 
 * @returns vrai si aucune erreur, faux sinon
 */
async function updatePassword(token, password) {
    const client = await getPool().connect();
    try {
        // Retire les anciens tokens
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        // Vérifie si le token est vrai
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

//#region Utilisateurs

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

//#region Tokens
async function createIDToken(id_user, durationInMS, client) {
    const token = encrypt.generateToken();
    const expirationDate = new Date(Date.now() + durationInMS);
    await client.query('INSERT INTO token (id_user, token, expire_at) VALUES ($1, $2, $3)', [id_user, token, expirationDate]);
    return token;
}

async function destroyOldIDToken(id_user, client) {
    await client.query('DELETE FROM token WHERE id_user = $1 OR expire_at < NOW()', [id_user]);
}

//#endregion

module.exports = {
    addUser,
    getUser,
    sendPasswordForgottenEmail,
    isIDTokenValid,
    updatePassword
};
