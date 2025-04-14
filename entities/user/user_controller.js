const User = require('./user_model');
const authVerif = require('../../public/js/shared/auth');

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
        req.session.error = authVerif.messages.wrongPassword
        res.redirect('/user/parametres');
    } else {
        try {
            if (authVerif.verifyUsername(username)) {
                await User.modifyUsername(id_user, username);
                req.session.usernameChanged = authVerif.messages.modifiedWithSuccess
            }
            if (authVerif.verifyEmail(email)) {
                const emailUsed = await User.modifyEmail(id_user, email);
                if (emailUsed) {
                    req.session.emailChanged = authVerif.messages.modifiedWithSuccess
                } else {
                    req.session.emailError = authVerif.messages.alreadyUsedEmail
                }
            }
            if (authVerif.verifyPassword(new_password)) {
                await User.modifyPassword(id_user, new_password);
                req.session.passwordChanged = authVerif.messages.modifiedWithSuccess
            }
            res.redirect('/user/parametres');
        } catch (error) {
            req.session.error = authVerif.messages.defaultError
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
