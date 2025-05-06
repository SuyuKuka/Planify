const Auth = require('./index_model');
const vueList = ['jour', 'semaine', 'mois', 'annee'];

async function getIndex(req, res) {
    let vue = req.query.vue;
    if (!vueList.includes(vue)) {
        vue = "semaine";
    }
    const token = req.session.token;
    const result = await Auth.getInfo(token);
    if (!result) {
        res.render('index', {
            token,
            user_username: undefined,
            vue
        });
    } else {
        res.render('index', {
            token,
            user_username: result.username,
            vue
        });
    }
}

async function getSearchProfil(req, res) {
    const { word } = req.query;
    const results = await Auth.prefixSearch(word, word);
    res.json(results);
}

async function postCreateReunion(req, res) {
    const { name, date, time, participants } = req.body;
    const token = req.session.token;

    const participantsArray = participants
        .split(',')
        .map(email => email.trim())
        .filter(email => email !== '');

    const { user_id, email } = await Auth.getInfo(token);
    
    const result = await Auth.createReunion(name, date, time, participantsArray, user_id, email);
    if (result === -1) {
        req.session.error = "Vous avez déjà une réunion à cette date et heure avec ce nom.";
    }
    res.redirect('/');
}

module.exports = { getIndex, getSearchProfil, postCreateReunion }; 