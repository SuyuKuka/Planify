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

function verifyUsername(username) {
    return username && /^[A-Z][A-Za-z' -]{1,31}$/.test(username.trim());
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
    const { surname, name, birthdate, username, email, error_step1, error_step2 } = req.session;
    if (req.session) {
        destroySession(req, res);
    }
    res.render('auth/inscription', {
        surname, name, birthdate, username, email,
        error_step1, error_step2
    });
}

function getRegistrationVerif(req, res) {
    res.redirect('/auth/inscription');
}

async function postRegistrationVerif(req, res) {
    const ret = verifyRegistration(req.body);
    const { surname, name, birthdate, username, email, password } = req.body;
    try {
        if (ret.size == 0) {
            const emailUsed = await Auth.isEmailAlreadyUsed(email);
            if (emailUsed) { // Cas email déjà utilisé
                Object.assign(req.session, {
                    surname, name, birthdate, username, email,
                    error_step2: errorMessages.alreadyUsedEmail
                });
                res.redirect('/auth/inscription');
            } else { // Cas succès
                await Auth.addUser(surname, name, birthdate, username, email, password);
                Object.assign(req.session, {
                    surname, name, birthdate, username, email
                });
                res.redirect('/');
            }
        } else { // Cas au moins une valeur non valide
            Object.assign(req.session, {
                surname, name, birthdate, username, email,
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
    const { email, error } = req.session;
    if (req.session) {
        destroySession(req, res);
    }
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
    console.log(email, password);
    try {
        if (ret) {
            const user = await Auth.getUser(email, password);
            if (user === null) { // Cas email ou mot de passe incorrect
                Object.assign(req.session, {
                    email,
                    error:errorMessages.wrongEmailOrPassword
                });
                res.redirect('/auth/connexion');
            } else { // Cas succes
                const { username, surname, name, birthdate } = user;
                Object.assign(req.session, {
                    surname, name, birthdate, email,
                    username: user.username
                });
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
            res.redirect('/auth/mdp_oublie_succes');
        } else {
            req.session.error = errorMessages.invalidQuery;
            res.redirect('/auth/mdp_oublie');
        }
    } catch (error) {
        req.session.error = errorMessages.default;
        res.redirect('/auth/mdp_oublie');
    }
}

async function getPasswordReset(req, res) {
    const token = req.query.token;
    if (!token) {
        return res.redirect('/auth/mdp_oublie/'); 
    }
    try {
        let result = await Auth.checkToken(token);
        if (result.rows.length === 0) {
            res.redirect('/auth/mdp_oublie/');
        } else {
            res.render('auth/mdp_reinitialisation', { token });
        }
    } catch (error) {
        res.redirect('/auth/mdp_oublie/');
    }
}

function getPasswordResetVerif(req, res) {
    res.redirect('/auth/mdp_oublie/');
}

async function postPasswordResetVerif(req, res) {
    const { password } = req.body;
    const token = req.body.token;
    if (!token) {
        res.redirect('/auth/mdp_oublie/'); 
    }
    try {
        let result = await Auth.checkToken(token);
        if (result.rows.length === 0) {
            res.redirect('/auth/mdp_oublie/');
        } else {
            await Auth.updatePassword(result.rows[0].email, password);
            res.redirect('/auth/connexion');
        }
    } catch (error) {
        res.redirect('/auth/mdp_oublie/'); 
    }
}

//#endregion

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