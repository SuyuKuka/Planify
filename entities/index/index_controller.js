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

async function search(req, res) {
    const { word } = req.query;
    const results = await Auth.prefixSearch(word, word);
    res.json(results);
}

module.exports = { getIndex, search }; 