const User = require('./user_model');

//#region Erreurs
const messages = Object.freeze({
    default: {
        code: 0,
        msg: "Une erreur est survenue. Veuillez réessayer plus tard."
    },
    wrongPassword: {
        code: 1,
        msg: "Le mot de passe est erroné."
    },
    alreadyUsedEmail: {
        code: 2,
        msg: "L'adresse email spécifiée est déjà associé à un compte."
    },
    success: {
        code: 3,
        msg: "Modifié avec succès !"
    }
});
//#endregion

//#region Vérif Authentification
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

async function getProfile(req, res) {
    const token = req.session.token;
    if (token === undefined || token === null) {
        res.redirect('/auth/connexion');
    } else {
        let result = await User.getInfo(token);
        const { id_user, surname, name, birthdate, username, email } = result;
        res.render('user/profil', {
            id_user, surname, name, birthdate, username, email
        });
    }
}

async function getParameters(req, res) {
    const token = req.session.token;
    if (token === undefined || token === null) {
        res.redirect('/auth/connexion');
    } else {
        const { error, usernameChanged, emailChanged, emailError, passwordChanged } = req.session;
        let result = await User.getInfo(token);
        const { username, email } = result;
        res.render('user/parametres', {
            username, email, error,
            usernameChanged, emailChanged, emailError, passwordChanged
        });
    }
}

function getParametersChangesVerif(req, res) {
    destroyError(req);
    res.redirect('/auth/connexion');
}

async function postParametersChangesVerif(req, res) {
    const token = req.session.token;
    let result = await User.getInfo(token);
    if (token === undefined || token === null) {
        res.redirect('/auth/connexion');
    }

    const id_user = result.id_user;
    const password_user = result.password;
    const { username, email, password, new_password } = req.body;

    destroyError(req);
    const verify = await User.checkPassword(password, password_user);
    if (!verify) {
        req.session.error = messages.wrongPassword;
        res.redirect('/user/parametres');
    } else {
        try {
            if (verifyUsername(username)) {
                await User.modifyUsername(id_user, username);
                req.session.usernameChanged = messages.success;
            }
            if (verifyEmail(email)) {
                const emailUsed = await User.modifyEmail(id_user, email);
                if (emailUsed) {
                    req.session.emailChanged = messages.success;
                } else {
                    req.session.emailError = messages.alreadyUsedEmail;
                }
            }
            if (verifyPassword(new_password)) {
                await User.modifyPassword(id_user, new_password);
                req.session.passwordChanged = messages.success;
            }
            res.redirect('/user/parametres');
        } catch (error) {
            req.session.error = messages.default;
            res.redirect('/user/parametres');
        }
    }   
}

async function getPasswordReset(req, res) {
    const token = req.session.token;
    let result = await User.getInfo(token);
    const { username, email } = result;
    res.render('user/mdp_reinitialisation', {
        username, email
    });
}

function destroyError(req) {
    req.session.error = undefined;
    req.session.usernameChanged = undefined;
    req.session.emailChanged = undefined;
    req.session.emailError = undefined;
    req.session.passwordChanged = undefined;
}

module.exports = {
    getProfile,

    getParameters,

    getParametersChangesVerif,
    postParametersChangesVerif,

    getPasswordReset
};
