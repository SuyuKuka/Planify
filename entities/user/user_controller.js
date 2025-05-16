const User = require('./user_model');
const authVerif = require('../../public/js/client_server_shared/auth');

//#region Profil
async function getProfile(req, res) {
    const token = req.session.token;
    const { id } = req.query;
    if (token !== undefined || token !== null) {
        const user = await User.getUserInfoWithToken(token);
        if (user !== undefined) {
            if (user.user_id === id || id === undefined || id === null) {
                try {
                    const user = await User.getUserInfoWithToken(token);
                    const { user_id, surname, name, birthdate, username, email, profilepicture } = user;
                    const utc2Birthdate = new Date(birthdate).toLocaleDateString('en-CA', {
                        timeZone: 'Europe/Bucharest'
                    });
                    res.render('user/profil', {
                        token,
                        user_username: username,
                        user_id, surname, name, username, email,
                        birthdate: utc2Birthdate, profilepicture
                    });
                } catch (error) {
                    res.redirect('/auth/connexion');
                } 
                return;
            }
        }
    } 

    if (id === undefined || id === null) {
        res.redirect('/');
        return;
    }

    const user = await User.getPeopleInfoWithId(id);
    if (user === undefined) {
        // voie url? avec une personne qui n'existe pas
        res.redirect('/user/profil');
        return;
    }

    const user_username = await User.getUsername(token);
    const { user_id, username, profilepicture } = user;
    res.render('user/profil', {
        token,
        user_username: user_username? user_username : undefined,
        user_id, username, profilepicture,
        name : undefined, surname : undefined, email : undefined, birthdate : undefined
    });
}

async function postProfile(req, res) {
    const token = req.session.token;
    if (!token || !req.file) {
        // voie illégal
        return res.redirect('/auth/connexion');
    }

    try {
        const filePath = '/images/profile/' + req.file.filename;
        const result = await User.updateProfilePicture(token, filePath);
        if (result) {
            res.redirect('/user/profil');
        } else {
            // faire la session avec error
            res.redirect('/user/profil');
        }
    } catch (error) {
        // faire la session avec error
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
        const user = await User.getUserInfoWithToken(token);
        const { username, email,  } = user;
        res.render('user/parametres', {
            token,
            user_username: username,
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
        const user = await User.getUserInfoWithToken(token);
        const user_id = user.user_id;
        const password_user = user.password;
        const { username, email, password, new_password } = req.body;
        const verify = await User.checkPassword(password, password_user);
        if (!verify) {
            req.session.error = authVerif.messages.wrongPassword
            res.redirect('/user/parametres');
            return;
        }

        if (username) {
            if (authVerif.isUsernameValid(username)) {
                await User.modifyUsername(user_id, username);
                req.session.usernameChanged = authVerif.messages.modifiedWithSuccess
            }
        }
        
        if (email) {
            if (authVerif.isEmailValid(email)) {
                const emailUsed = await User.modifyEmail(user_id, email);
                if (emailUsed) {
                    req.session.emailChanged = authVerif.messages.modifiedWithSuccess
                } else {
                    req.session.emailError = authVerif.messages.alreadyUsedEmail
                }
            }
        }

        if (new_password) {
            if (authVerif.isPasswordValid(new_password)) {
                await User.modifyPassword(user_id, new_password);
                req.session.passwordChanged = authVerif.messages.modifiedWithSuccess
            }
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
    postProfile,

    getParameters,

    getParametersChangesVerif,
    postParametersChangesVerif

};
