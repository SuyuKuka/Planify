const Auth = require('./auth_model');
const authVerif = require('../../public/js/shared/auth');

//#region Inscription
function getRegistration(req, res) {
    const { id_user, surname, name, birthdate, username, email, error_step1, error_step2 } = req.session;

    destroy(req);
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
    const ret = verifyRegistration(req.body);
    const { id_user, surname, name, birthdate, username, email, password } = req.body;
    try {
        if (ret.size === 0) { // Aucun problème de syntaxe
            const isEmailUsed = await Auth.isEmailAlreadyUsed(email);
            if (isEmailUsed) { // Cas email déjà utilisé
                Object.assign(req.session, {
                    id_user, surname, name, birthdate, username, email,
                    error_step2: authVerif.messages.alreadyUsedEmail
                });
                res.redirect('/auth/inscription');
            } else { // Cas succès
                let verif = await Auth.addUser(id_user, surname, name, birthdate, username, email, password);
                if (!verif) {
                    Object.assign(req.session, { id_user, surname, name, birthdate, username, email, error_step2: authVerif.messages.alreadyUsedID });
                    res.redirect('/auth/inscription');
                } else {
                    const token = await Auth.addIDtoToken(id_user);
                    Object.assign(req.session, { token });
                    res.redirect('/');
                }
            }
        } else { // Erreur de syntaxe detectée
            Object.assign(req.session, {
                id_user, surname, name, birthdate, username, email,
                error_step1: ret.has(1) ? authVerif.messages.invalidQueries : undefined,
                error_step2: ret.has(2) ? authVerif.messages.invalidQueries : undefined
            });
            res.redirect('/auth/inscription');
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
    const { email, error, success } = req.session;

    destroy(req);
    res.render('auth/connexion', {
        email, error, success
    });
}

function getConnectionVerif(req, res) {
    res.redirect('/auth/connexion');
}

async function postConnectionVerif(req, res) {
    const ret = verifyConnection(req.body);
    const { email, password } = req.body;
    try {
        if (ret) {
            let email_lower = email.toLowerCase();
            const user = await Auth.getUser(email_lower, password);
            if (user === undefined) { // Cas email ou mot de passe incorrect
                Object.assign(req.session, {
                    email,
                    error: authVerif.messages.wrongEmailOrPassword
                });
                res.redirect('/auth/connexion');
            } else { // Cas succes
                const { id_user } = user;
                const token = await Auth.addIDtoToken(id_user);
                Object.assign(req.session, { token });
                res.redirect('/');
            }
        } else { // Cas au moins une valeur non valide
            Object.assign(req.session, {
                email,
                error: authVerif.messages.invalidQueries
            });
            res.redirect('/auth/connexion');
        }
    } catch (e) {
        req.session.error = authVerif.messages.default;
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
    const { email, error } = req.session;
    
    destroy(req);
    res.render('auth/mdp_oublie', {
        email, error
    });
}

function getPasswordForgottenSuccess(req, res) {
    res.render('auth/mdp_oublie_succes');
}

async function postPasswordForgottenSuccess(req, res) {
    const { email } = req.body;
    try {
        if (authVerif.isEmailValid(email)) {
            await Auth.sendPasswordForgottenEmail(email);
            res.redirect('/auth/mot_de_passe_oublie_succes');
        } else {
            Object.assign(req.session, {
                error: authVerif.messages.invalidQueries
            });
            res.redirect('/auth/mot_de_passe_oublie');
        }
    } catch (error) {
        req.session.error = authVerif.messages.default;
        res.redirect('/auth/mot_de_passe_oublie');
    }
}

//#endregion

//#region Reinitialisation

async function getPasswordReset(req, res) {
    const token = req.query.token;
    const error = req.session.error;

    destroy(req);
    if (token === undefined || token === null) {
        Object.assign(req.session, {
            error: authVerif.messages.tokenInvalid
        });
        res.redirect('/auth/mot_de_passe_oublie/');
    } else {
        const result = await Auth.checkToken(token);
        if (result.rows.length === 0) {
            Object.assign(req.session, {
                error: authVerif.messages.tokenExpired
            });
            res.redirect('/auth/mot_de_passe_oublie/'); 
        } else {
            Object.assign(req.session, { token });
            res.render('auth/mdp_reinitialisation', { error });
        }
    }
}

function getPasswordResetVerif(req, res) {
    res.redirect('/auth/mot_de_passe_oublie/');
}

async function postPasswordResetVerif(req, res) {
    const { password } = req.body;
    const token = req.session.token;
    req.session.token = undefined;
    if (!token) { // Cas le token n'existe pas (passage par l'url)
        Object.assign(req.session, {
            error: authVerif.messages.tokenInvalid
        });
        res.redirect('/auth/mot_de_passe_oublie/'); 
    }
    try {
        let result = await Auth.checkToken(token);
        if (result.rows.length === 0) { // Cas le token n'existe pas (il a expiré) 
            Object.assign(req.session, {
                error: authVerif.messages.tokenInvalid
            });
            res.redirect('/auth/mot_de_passe_oublie/');
        } else {
            await Auth.updatePassword(result.rows[0].id_user, password);
            Object.assign(req.session, {
                email: result.rows[0].email,
                success: "Le mot de passe a bien été changé."
            });
            res.redirect('/auth/connexion');
        }
    } catch (error) {
        Object.assign(req.session, { error: authVerif.messages.default });
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

function destroy(req) {
    req.session.id_user = undefined;
    req.session.surname = undefined;
    req.session.name = undefined;
    req.session.birthdate = undefined;
    req.session.username = undefined;
    req.session.email = undefined;
    req.session.error = undefined;
    req.session.error_step1 = undefined;
    req.session.error_step2 = undefined;
    req.session.success = undefined;
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