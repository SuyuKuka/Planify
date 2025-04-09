const User = require('./user_model');

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
    const { username, email } = req.session;
    if (username === undefined || email === undefined) {
        res.redirect('/auth/connexion');
    } else {
        res.render('user/parametres', {
            username, email
        });
    }
}

async function postChangeParameters(req, res) {
    let { username, email, password, new_password } = req.body;
    const old_username = req.session.username;
    const old_email = req.session.email;

    if (username === undefined || username === '') {
        username = req.session.username;
    }
    if (email === undefined || email === old_email || email === '') {
        email = old_email;
    }
    if (new_password === undefined || new_password === '') {
        new_password = password;
    }

    let verify = await User.modifyUser(username, email, password, old_email, new_password);
    if (verify === 0) {
        Object.assign(req.session, {
            username, email
        });
        res.render('user/parametres', {
            username, email
        });
    } else if (verify === 1) {
        username = old_username;
        email = old_email;
        res.render('user/parametres', {
            username, email, error : "L'adresse email specifiee est deja associee a un compte."
        });
    } else {
        username = old_username;
        email = old_email;
        res.render('user/parametres', {
            username, email, error : "Le mot de passe actuel est incorrect."
        });
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

    postChangeParameters,

    getPasswordReset
};
