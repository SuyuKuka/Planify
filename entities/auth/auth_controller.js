const Auth = require('./auth_model');

//#region Erreurs
const errorMessages = Object.freeze({
    default: {
        code: 0,
        msg: "Une erreur est survenue. Veuillez réessayer plus tard."
    },
    wrongEmailOrPassword: {
        code: 1,
        msg: "L'email ou le mot de passe est erroné."
    },
    alreadyUsedEmail: {
        code: 2,
        msg: "L'adresse email spécifiée est déjà associé à un compte."
    },
    invalidQuery: {
        code: 3,
        msg: "Les données spécifiées ne sont pas valides."
    },
    alreadyUsedIDUser: {
        code: 4,
        msg: "L'identifiant specifié est deja utilisé."
    }
});
//#endregion

//#region Vérif Authentification
function verifySurname(surname) {
    return surname && /^[A-Z][A-Za-z'éèëêîïç -]{1,31}$/.test(surname.trim());
}

function verifyName(name) {
    return name && /^[A-Z][A-Za-z'éèëêîïç -]{1,31}$/.test(name.trim());
}

function verifyBirthdate(birthdate) {
    if (birthdate) {
        const inputDate = new Date(birthdate);
        const minDate = new Date('1900-01-01');
        const maxDate = new Date();
        return (inputDate >= minDate && inputDate < maxDate);
    } else {
        return false;
    }
}

function verifyIDUser(id_user) {
    return id_user && /^@[A-Za-z0-9][A-Za-z0-9' -]{2,31}$/.test(id_user.trim());
}

function verifyUsername(username) {
    return username && /^[A-Za-z0-9][A-Za-z0-9' -]{2,31}$/.test(username.trim());
}

function verifyEmail(email) {
    return email && /^\S+@\S+\.\S+$/.test(email.trim());
}

function verifyPassword(password) {
    if (password) {
        const trimmed = password.trim();
        return trimmed.length >= 8 && trimmed.length <= 32;
    }
    return false;
}

//#endregion

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

async function postRegistrationVerif(req, res) {
    const ret = verifyRegistration(req.body);
    const { id_user, surname, name, birthdate, username, email, password } = req.body;
    try {
        if (ret.size == 0) {
            let email_lower = email.toLowerCase();
            const emailUsed = await Auth.isEmailAlreadyUsed(email_lower);
            if (emailUsed) { // Cas email déjà utilisé
                Object.assign(req.session, {
                    id_user, surname, name, birthdate, username, email,
                    error_step2: errorMessages.alreadyUsedEmail
                });
                res.redirect('/auth/inscription');
            } else { // Cas succès
                let verify = await Auth.addUser(id_user, surname, name, birthdate, username, email_lower, password);
                if (!verify) {
                    Object.assign(req.session, {
                        id_user, surname, name, birthdate, username, email,
                        error_step2: errorMessages.alreadyUsedIDUser
                    });
                    res.redirect('/auth/inscription');
                } else {
                    const token = await Auth.addIDtoToken(id_user);
                    Object.assign(req.session, { token });
                    res.redirect('/');
                }
            }
        } else { // Cas au moins une valeur non valide
            Object.assign(req.session, {
                id_user, surname, name, birthdate, username, email,
                error_step1: ret.has(1) ? errorMessages.invalidQuery : undefined,
                error_step2: ret.has(2) ? errorMessages.invalidQuery : undefined
            });

            res.redirect('/auth/inscription');
        }
    } catch (error) {
        req.session.error_step1 = errorMessages.default;
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
    if (!verifySurname(req_body.surname)) {
        req_body.surname = '';
        errorSteps.add(1);
    }
    if (!verifyName(req_body.name)) {
        req_body.name = '';
        errorSteps.add(1);
    }
    if (!verifyBirthdate(req_body.birthdate)) {
        req_body.birthdate = '';
        errorSteps.add(1);
    }
    if (!verifyIDUser(req_body.id_user)) {
        req_body.id_user = '';
        errorSteps.add(2);
    }
    if (!verifyUsername(req_body.username)) {
        req_body.username = '';
        errorSteps.add(2);
    }
    if (!verifyEmail(req_body.email)) {
        req_body.email = '';
        errorSteps.add(2);
    }
    if (!verifyPassword(req_body.password)) {
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
    try {
        if (ret) {
            let email_lower = email.toLowerCase();
            const user = await Auth.getUser(email_lower, password);
            if (user === undefined) { // Cas email ou mot de passe incorrect
                Object.assign(req.session, {
                    email,
                    error:errorMessages.wrongEmailOrPassword
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
                error: errorMessages.invalidQuery
            });
            res.redirect('/auth/connexion');
        }
    } catch (e) {
        req.session.error = errorMessages.default;
        res.redirect('/auth/connexion');
    }
}

function verifyConnection(req_body) {
    let valid = true;
    if (!verifyEmail(req_body.email)) {
        req_body.email = '';
        valid = false;
    }
    if (!verifyPassword(req_body.password)) {
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