const User = require('./user_model');
const authVerif = require('../../public/js/shared/auth');

//#region Profil
async function getProfile(req, res) {
    const token = req.session.token;
    if (!token) {
        res.redirect('/auth/connexion');
        return;
    }
    try {
        const user = await User.getInfo(token);
        const { user_id, surname, name, birthdate, username, email } = user;
        const utc2Birthdate = new Date(birthdate).toLocaleDateString('en-CA', {
            timeZone: 'Europe/Bucharest'
        });
        res.render('user/profil', {
            user_id, surname, name, username, email,
            birthdate: utc2Birthdate
        });
    } catch (error) {
        res.redirect('/auth/connexion');
    }
}
//#endregion

//#region Paramètres

async function getParameters(req, res) {
    const token = req.session.token;
    if (!token) {
        res.redirect('/auth/connexion');
        return;
    }
    try {
        const user = await User.getInfo(token);
        const { username, email } = user;
        res.render('user/parametres', {
            username, email
        });
    } catch (error) {
        res.redirect('/auth/connexion');
    }
}

function getParametersChangesVerif(req, res) {
    res.redirect('/auth/connexion');
}

async function postParametersChangesVerif(req, res) {
    const token = req.session.token;
    if (!token) {
        res.redirect('/auth/connexion');
        return;
    }
    destroyError(req);
    try {
        const user = await User.getInfo(token);
        const user_id = user.user_id;
        const password_user = user.password;
        const { username, email, password, new_password } = req.body;
        const verify = await User.checkPassword(password, password_user);
        if (!verify) {
            req.session.error = authVerif.messages.wrongPassword
            res.redirect('/user/parametres');
            return;
        }
        if (authVerif.verifyUsername(username)) {
            await User.modifyUsername(user_id, username);
            req.session.usernameChanged = authVerif.messages.modifiedWithSuccess
        }
        if (authVerif.verifyEmail(email)) {
            const emailUsed = await User.modifyEmail(user_id, email);
            if (emailUsed) {
                req.session.emailChanged = authVerif.messages.modifiedWithSuccess
            } else {
                req.session.emailError = authVerif.messages.alreadyUsedEmail
            }
        }
        if (authVerif.verifyPassword(new_password)) {
            await User.modifyPassword(user_id, new_password);
            req.session.passwordChanged = authVerif.messages.modifiedWithSuccess
        }
        res.redirect('/user/parametres');
    } catch (error) {
        req.session.error = authVerif.messages.defaultError
        res.redirect('/user/parametres');
    }
}

//#endregion

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
    postParametersChangesVerif

};
