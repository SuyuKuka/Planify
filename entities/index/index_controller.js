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
            email: undefined,
            username: undefined,
            vue
        });
    } else {
        res.render('index', {
            email: result.email,
            username: result.username,
            vue
        });
    }
}

module.exports = { getIndex }; 