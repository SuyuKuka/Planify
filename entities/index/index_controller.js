const Auth = require('./index_model');

async function getIndex(req, res) {
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