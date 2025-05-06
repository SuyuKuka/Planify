const Auth = require('./auth_model');
const authVerif = require('../../public/js/client_server_shared/auth');

//#region Inscription
function getRegistration(req, res) {
    const { user_id, surname, name, birthdate, username, email, error_step1, error_step2 } = req.session;

    res.render('auth/inscription', {
        user_id, surname, name, birthdate, username, email,
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
    const { user_id, surname, name, birthdate, username, email, password } = req.body;
    // Erreurs de syntaxes
    if (retSet.size !== 0) {
        Object.assign(req.session, {
            user_id, surname, name, birthdate, username, email,
            error_step1: retSet.has(1) ? authVerif.messages.invalidQueries : undefined,
            error_step2: retSet.has(2) ? authVerif.messages.invalidQueries : undefined
        });
        res.redirect('/auth/inscription');
        return;
    } 
    try {
        const data = {
            user_id, surname, name, birthdate, username, email, password
        };
        const tokenCreated = await Auth.addUser(data);
        if (!tokenCreated) { // Cas erreur
            Object.assign(req.session, {
                surname, name, birthdate, username,
                user_id: data.user_id,
                email: data.email,
                emailUsed: data.emailUsed ? authVerif.messages.alreadyUsedEmail : undefined,
                idUsed: data.idUsed ? authVerif.messages.alreadyUsedUserID : undefined,
                error_step2: authVerif.messages.invalidQueries
            });
            res.redirect('/auth/inscription');
        } else { // Succès
            Object.assign(req.session, { token: tokenCreated });
            res.redirect('/');
        }
    } catch (error) {
        req.session.error_step1 = authVerif.messages.defaultError;
        res.redirect('/auth/inscription');
    }
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
    // Erreurs de syntaxes
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
        const tokenCreated = await Auth.getUser(email_lower, password);
        if (!tokenCreated) { // Cas email ou mot de passe incorrect
            Object.assign(req.session, {
                email,
                error: authVerif.messages.wrongEmailOrPassword
            });
            res.redirect('/auth/connexion');
        } else { // Cas succes
            Object.assign(req.session, { token: tokenCreated });
            res.redirect('/');
        }
    } catch (error) {
        req.session.error = authVerif.messages.defaultError;
        res.redirect('/auth/connexion');
    }
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
    // Erreurs de syntaxes
    if (!authVerif.isEmailValid(email)) {
        req.session.error = authVerif.messages.invalidQueries;
        res.redirect('/auth/mot_de_passe_oublie');
        return;
    }
    try {
        // L'utilisateur ne sera pas notifié de si l'email spécifié existe ou pas.
        await Auth.sendPasswordForgottenEmail(email);
        res.redirect('/auth/mot_de_passe_oublie_succes');
    } catch (error) {
        req.session.error = authVerif.messages.default;
        res.redirect('/auth/mot_de_passe_oublie');
    }
}

//#endregion

//#region Reinitialisation

async function getPasswordReset(req, res) {
    const token = req.query.token;
    try {
        if (!token || !await Auth.isIDTokenValid(token)) {
            return res.redirect('/auth/mot_de_passe_oublie/'); 
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
    const { token, password } = req.body;
    // Cas le token n'existe pas (passage par l'url)
    if (!token || !authVerif.isPasswordValid(password)) {
        res.redirect('/auth/mot_de_passe_oublie/'); 
    }
    try {
        // Aucun token trouvé
        if (!await Auth.isIDTokenValid(token)) {
            res.status(401).send(authVerif.messages.tokenExpired);
            return;
        }
        if (!await Auth.updatePassword(token, password)) {
            req.session.error = authVerif.messages.defaultError;
        }
        res.redirect('/auth/connexion');
    } catch (error) {
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

//#region Vérification Inscriptions/Connexion

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
    if (!authVerif.isIdUserValid(req_body.user_id)) {
        req_body.user_id = '';
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