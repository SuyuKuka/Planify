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
        const idUsed = (await client.query('SELECT 1 FROM "user" WHERE user_id = $1 LIMIT 1', [data.user_id])).rowCount > 0;
        if (idUsed) {
            data.user_id = "";
            data.idUsed = true;
        }

        if (emailUsed || idUsed) {
            return undefined;
        }
    
        // Ajoute l'utilisateur avec mot de passe crypté dans la db
        const { user_id, surname, name, birthdate, username, email, password } = data;
        const hashedPassword = await encrypt.hash(password);
        const profilepicture = "/images/profile/default.png";
        const insertQuery = 'INSERT INTO "user" (user_id, surname, name, birthdate, username, email, password, profilepicture) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
        const dataList = [user_id, surname, name, birthdate, username, email, hashedPassword, profilepicture];
        await client.query(insertQuery, dataList);

        const user_no_acc = await client.query('SELECT * FROM no_account WHERE email = $1 LIMIT 1', [email]);
        if (user_no_acc.rowCount > 0) {
            await client.query('UPDATE response SET user_id = $1 WHERE user_id = $2', [user_id, user_no_acc.rows[0].user_id]);
            await client.query('UPDATE response SET user_id = $1 WHERE user_id = $2', [user_id, user_no_acc.rows[0].user_id]);
            await client.query('DELETE FROM no_account WHERE email = $1', [email]);
        }
    
        // Par sécurité, on retire les potentiels tokens 99.9% impossible
        await destroyOldIDToken(user_id, client);
    
        // On crée et retourne le token associé à l'utilisateur
        return await createIDToken(user_id, connectSessionDuration, client);
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
        const userIdQuery = await client.query('SELECT token FROM token WHERE user_id = $1 AND expire_at > NOW() LIMIT 1', [user.user_id]);
        if (userIdQuery.rowCount > 0) {
            return userIdQuery.rows[0].token;
        }

        // Sinon, en génère un nouveau et le renvoie
        return await createIDToken(user.user_id, connectSessionDuration, client);
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
        const result = await client.query('SELECT user_id FROM "user" WHERE email = $1 LIMIT 1', [email]);
        if (result.rowCount === 0) {
            return -1;
        }
        const user_id = result.rows[0].user_id;
        await destroyOldIDToken(user_id, client);

        // L'email expire après 5 minutes
        const token = await createIDToken(user_id, resetSessionDuration, client);
        // TODO: envoyer le mail depuis services/mailer ?
        await mail.transporter.sendMail({
            from: 'programmationwebprojet@gmail.com',
            to: email,
            subject: 'Réinitialisation de votre mot de passe',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Réinitialisation de votre mot de passe</h2>
                    <p>Bonjour ${email},</p>
                    <p>Vous avez demandé à réinitialiser votre mot de passe. Pour continuer, veuillez cliquer sur le bouton ci-dessous :</p>
                    <p style="text-align: center;">
                        <a href="http://localhost:8080/auth/mot_de_passe_reinitialisation?token=${token}" 
                        style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #007BFF; text-decoration: none; border-radius: 5px;">
                            Réinitialiser mon mot de passe
                        </a>
                    </p>
                    <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.</p>
                    <p>Cordialement,<br>L'équipe de Planify</p>
                    <img src="https://i.imgur.com/NLYAF2v.png" alt="Logo du site" style="width: 200px; height: 50px;"/>
                </div>
            `
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
    console.log("tokenaaaAAAAaa: " + token);
    try {
        // Retire les anciens tokens
        await client.query('DELETE FROM token WHERE expire_at < NOW()');
        // Vérifie si le token est vrai
        const result = await client.query('SELECT user_id FROM token WHERE token = $1 LIMIT 1', [token]);
        if (result.rowCount < 1) {
            return false;
        }
        const user_id = result.rows[0].user_id;
        console.log(user_id);
        await destroyOldIDToken(user_id, client);
        const hashedPassword = await encrypt.hash(password);
        console.log(hashedPassword);
        await client.query('UPDATE "user" SET password = $1 WHERE user_id = $2', [hashedPassword, user_id]);
        console.log("done");
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
    console.log("token: " + token);
    try {
        const result = await client.query('SELECT 1 FROM token WHERE token = $1 AND expire_at > NOW() LIMIT 1', [token]);
        console.log(result.rowCount > 0);
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
async function createIDToken(user_id, durationInMS, client) {
    const token = encrypt.generateToken();
    const expirationDate = new Date(Date.now() + durationInMS);
    await client.query('INSERT INTO token (user_id, token, expire_at) VALUES ($1, $2, $3)', [user_id, token, expirationDate]);
    return token;
}

async function destroyOldIDToken(user_id, client) {
    await client.query('DELETE FROM token WHERE user_id = $1 OR expire_at < NOW()', [user_id]);
}

//#endregion

module.exports = {
    addUser,
    getUser,
    sendPasswordForgottenEmail,
    isIDTokenValid,
    updatePassword
};
