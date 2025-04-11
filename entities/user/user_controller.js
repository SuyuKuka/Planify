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

function getProfile(req, res) {
    const { surname, name, birthdate, username, email } = req.session;
    if (surname === undefined || name === undefined || birthdate === undefined || username === undefined || email === undefined) {
        res.redirect('/auth/connexion');
    } else {
        res.render('user/profil', {
            surname, name, birthdate, username, email
        });
    }
}

function getParameters(req, res) {
    const { username, email, error,
        usernameChanged, emailChanged, emailError, passwordChanged } = req.session;
    if (username === undefined || email === undefined) {
        res.redirect('/auth/connexion');
    } else {
        res.render('user/parametres', {
            username, email, error,
            usernameChanged, emailChanged, emailError, passwordChanged
        });
    }
}

function getParametersChangesVerif(req, res) {
    res.redirect('/auth/connexion');
}

async function postParametersChangesVerif(req, res) {
    // TODO: remplacer session_username, session_password par token + call model
    const session_username = req.session.username;
    const session_password = req.session.password;
    const { username, email, password, new_password } = req.body;

    if (!password == session_password) {
        req.session.error = messages.wrongPassword;
        res.redirect('/auth/connexion');
    }

    try {
        if (verifyUsername(username)) {
            await User.modifyUsername(session_username, username);
            // TODO: req.session.username = username; quand remplacer session_username par token
            req.session.username = username;
            req.session.usernameChanged = messages.success;
        }
        if (verifyEmail(email)) {
            const emailUsed = await User.modifyEmail(session_username, email);
            if (emailUsed) {
                req.session.email = email;
                req.session.emailChanged = messages.success;
            } else {
                req.session.emailError = messages.alreadyUsedEmail;
            }
        }
        if (verifyPassword(new_password)) {
            await User.modifyPassword(session_username, new_password);
            req.session.passwordChanged = messages.success;
        }
        res.redirect('/user/parametres');
    } catch (error) {
        req.session.error = messages.default;
        res.redirect('/user/parametres');
    }
}

function getPasswordReset(req, res) {
    const { username, email } = req.session;
    res.render('user/mdp_reinitialisation', {
        username, email
    });
}

module.exports = {
    getProfile,

    getParameters,

    getParametersChangesVerif,
    postParametersChangesVerif,

    getPasswordReset
};
