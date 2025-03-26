const Auth = require('./auth_model');

const authentificationType = {
    registration: "inscription",
    connection: "connexion",
    passwordForgotten: "mdpOublie"
}

const errorMessages = {
    default: "Une erreur est survenue. Veuillez réessayer plus tard.",
    wrongEmailOrPassword: "L'email ou le mot de passe est erroné.",
    alreadyUsedEmail: "L'adresse email spécifiée est déjà associé à un compte."
}

function getRegistration(req, res) {
    res.render('inscription');
}

async function postRegistration(req, res) {
    const { surname, name, birthdate, username, email, mdp } = req.body;
    try {
        const emailUsed = await Auth.isEmailAlreadyUsed(email);
        console.log(req.body);
        if (emailUsed) {
            res.render('inscription', {
                surname, name, birthdate, username, email,
                errMsg: errorMessages.alreadyUsedEmail
            });
        } else {
            await Auth.addUser(nom, prenom, date, pseudo, email, mdp);
            req.session.pseudo = pseudo;
            req.session.email = email;
            res.redirect('/');
        }
    } catch (error) {
        console.log(error);
        res.render('inscription', {
            errMsg: errorMessages.default
        });
    }
}

function getConnection(req, res) {
    res.render('connexion');
}

async function postConnection(req, res) {
    const { email, mdp } = req.body;
    try {
        const user = await Auth.getUser(email, mdp);
        if (user == null) {
            res.render('connexion', {
                email,
                errMsg: errorMessages.wrongEmailOrPassword
            });
        } else {
            req.session.pseudo = user.pseudo;
            req.session.email = email;
            res.redirect('/');
        }
    } catch(error) {
        res.render('connexion', {
            errMsg: errorMessages.default
        });
    }
}

function getPasswordForgotten(req, res) {
    res.render('mdp_oublie');
}

function getDisconnection(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erreur');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
}

module.exports = {
    getRegistration,
    postRegistration,

    getConnection,
    postConnection,

    getPasswordForgotten,

    getDisconnection
};