const User = require('./user_model');

function getProfile(req, res) {
    const { username, email } = req.session;
    res.render('user/profil', {
        username, email
    });
}

function getParameters(req, res) {
    const { username, email } = req.session;
    res.render('user/parametres', {
        username, email
    });
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

    getPasswordReset
};
