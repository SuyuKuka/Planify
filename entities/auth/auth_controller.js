const Auth = require('./auth_model');
const authVerif = require('../../public/js/shared/auth');

//#region Inscription
function getRegistration(req, res) {
    if (req.session === undefined || req.session === null) {
        destroySession(req, res);
    }
    const { id_user, surname, name, birthdate, username, email, error_step1, error_step2 } = req.session;
    res.render('auth/inscription', {
        id_user, surname, name, birthdate, username, email,
        error_step1, error_step2
    });
}

function getRegistrationVerif(req, res) {
    res.redirect('/auth/inscription');
}

/**
 * Vérification lors de l'inscription de l'utilisateur :
 * - Vérifie la syntaxe
 * - Vérifie si l'email est déjà utilisé
 * - Vérifie si l'identifiant est déjà utilisé
 * Si toutes ces conditions sont vérifiées,
 * l'utilisateur est enregistrée dans la base de donnée.
 * @param {*} req 
 * @param {*} res 
 */
async function postRegistrationVerif(req, res) {
    const retSet = verifyRegistration(req.body);
    const { id_user, surname, name, birthdate, username, email, password } = req.body;
    if (retSet.size !== 0) {
        Object.assign(req.session, {
            id_user, surname, name, birthdate, username, email,
            error_step1: retSet.has(1) ? authVerif.messages.invalidQueries : undefined,
            error_step2: retSet.has(2) ? authVerif.messages.invalidQueries : undefined
        });
        res.redirect('/auth/inscription');
        return;
    } 
    try {
        const data = {
            id_user, surname, name, birthdate, username, email, password
        };
        const tokenCreated = await Auth.addUser(data);
        if (!tokenCreated) {
            Object.assign(req.session, {
                id_user, surname, name, birthdate, username, email
            });
            res.redirect('/auth/inscription');
        } else {
            Object.assign(req.session, {
                token: tokenCreated
            });
            res.redirect('/');
        }
    } catch (error) {
        req.session.error_step1 = authVerif.messages.defaultError;
        res.redirect('/auth/inscription');
    }
}

/**
 * Vérifie la validité des données du form
 * @param {*} req_body 
 * @returns true si aucun problème, false sinon
 */
function verifyRegistration(req_body) {
    const errorSteps = new Set();
    if (!authVerif.isSurnameValid(req_body.surname)) {
        req_body.surname = '';
        errorSteps.add(1);
    }
    if (!authVerif.isNameValid(req_body.name)) {
        req_body.name = '';
        errorSteps.add(1);
    }
    if (!authVerif.isBirthdateValid(req_body.birthdate)) {
        req_body.birthdate = '';
        errorSteps.add(1);
    }
    if (!authVerif.isIdUserValid(req_body.id_user)) {
        req_body.id_user = '';
        errorSteps.add(2);
    }
    if (!authVerif.isUsernameValid(req_body.username)) {
        req_body.username = '';
        errorSteps.add(2);
    }
    if (!authVerif.isEmailValid(req_body.email)) {
        req_body.email = '';
        errorSteps.add(2);
    }
    req_body.email = req_body.email.toLowerCase();
    if (!authVerif.isPasswordValid(req_body.password)) {
        req_body.password = '';
        errorSteps.add(2);
    }
    return errorSteps;
}

//#endregion

//#region Connexion
function getConnection(req, res) {
    if (req.session === undefined || req.session === null) {
        destroySession(req, res);
    }
    const { email, error } = req.session;
    res.render('auth/connexion', {
        email, error
    });
}

function getConnectionVerif(req, res) {
    res.redirect('/auth/connexion');
}

async function postConnectionVerif(req, res) {
    const ret = verifyConnection(req.body);
    const { email, password } = req.body;
    if (!ret) {
        Object.assign(req.session, {
            email,
            error: authVerif.messages.invalidQueries
        });
        res.redirect('/auth/connexion');
        return;
    }
    try {
        const email_lower = email.toLowerCase();
        const user = await Auth.getUser(email_lower, password);
        if (user === undefined) { // Cas email ou mot de passe incorrect
            Object.assign(req.session, {
                email,
                error: authVerif.messages.wrongEmailOrPassword
            });
            res.redirect('/auth/connexion');
        } else { // Cas succes
            const token = await Auth.addIDtoToken(user.id_user);
            Object.assign(req.session, { token });
            res.redirect('/');
        }
    } catch (error) {
        req.session.error = authVerif.messages.defaultError;
        res.redirect('/auth/connexion');
    }
}

function verifyConnection(req_body) {
    let valid = true;
    if (!authVerif.isEmailValid(req_body.email)) {
        req_body.email = '';
        valid = false;
    }
    if (!authVerif.isPasswordValid(req_body.password)) {
        req_body.password = '';
        valid = false;
    }
    return valid;
}

//#endregion

//#region Mot de passe oublié

function getPasswordForgotten(req, res) {
    res.render('auth/mdp_oublie');
}

function getPasswordForgottenSuccess(req, res) {
    res.render('auth/mdp_oublie_succes');
}

async function postPasswordForgottenSuccess(req, res) {
    const { email } = req.body;
    const ret = verifyEmail(email);
    try {
        if (ret) {
            await Auth.sendPasswordForgottenEmail(email);
            res.redirect('/auth/mot_de_passe_oublie_succes');
        } else {
            req.session.error = errorMessages.invalidQuery;
            res.redirect('/auth/mot_de_passe_oublie');
        }
    } catch (error) {
        req.session.error = errorMessages.default;
        res.redirect('/auth/mot_de_passe_oublie');
    }
}

//#endregion

//#region Reinitialisation

async function getPasswordReset(req, res) {
    const token = req.query.token;
    if (!token) {
        return res.redirect('/auth/mot_de_passe_oublie/'); 
    }
    try {
        let result = await Auth.checkToken(token);
        if (result.rows.length === 0) {
            res.redirect('/auth/mot_de_passe_oublie/');
        } else {
            res.render('auth/mdp_reinitialisation', { token });
        }
    } catch (error) {
        res.redirect('/auth/mot_de_passe_oublie/');
    }
}

function getPasswordResetVerif(req, res) {
    res.redirect('/auth/mot_de_passe_oublie/');
}

async function postPasswordResetVerif(req, res) {
    const { password } = req.body;
    const token = req.body.token;
    if (!token) { // Cas le token n'existe pas (passage par l'url)
        res.redirect('/auth/mot_de_passe_oublie/'); 
    }
    try {
        let result = await Auth.checkToken(token);
        // TODO : mettre une erreur si le token a expiré (flm pour le moment)
        if (result.rows.length === 0) { // Cas le token n'existe pas (il a expiré) 
            res.redirect('/auth/mot_de_passe_oublie/');
        } else {
            await Auth.updatePassword(result.rows[0].id_user, password);
            res.redirect('/auth/connexion');
        }
    } catch (error) {
        console.error(error);
        res.redirect('/auth/mot_de_passe_oublie/'); 
    }
}

//#endregion

//#region Deconnexion

function getDisconnection(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erreur');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
}

function destroySession(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erreur');
        }
    });
}

//#endregion

//#region Export

module.exports = {
    getRegistration,

    getRegistrationVerif,
    postRegistrationVerif,

    getConnection,

    getConnectionVerif,
    postConnectionVerif,

    getPasswordForgotten,

    getPasswordForgottenSuccess,
    postPasswordForgottenSuccess,

    getPasswordReset,

    getPasswordResetVerif,
    postPasswordResetVerif,

    getDisconnection
};

//#endregion