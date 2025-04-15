const Auth = require('./index_model');
const vueList = ['jour', 'semaine', 'mois', 'annee'];

async function getIndex(req, res) {
    let vue = req.query.vue;
    if (!vueList.includes(vue)) {
        vue = "semaine";
    }
    const token = req.session.token;
    let result = await Auth.getInfo(token);
    console.log(result);
    if (token === undefined || token === null) {
        email = undefined;
        username = undefined;
        
        res.render('index', {
            email, username, vue
        });
    } else {
        res.render('index', {
            email: result.email,
            username: result.username,
            vue
        });
    }
}

async function postIndex(req, res) {
    const token = req.session.token;
    let result = await Auth.getInfo(token);
    if (token === undefined || token === null) {
        email = undefined;
        username = undefined;
        res.render('index', {
            email: email,
            username: username
        });
    } else {
        res.render('index', {
            email: result.email,
            username: result.username
        });
    }
}

module.exports = { getIndex, postIndex }; 