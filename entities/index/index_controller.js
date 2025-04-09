function getIndex(req, res) {
    res.render('index', {
        email: req.session.email,
        username: req.session.username
    });
}

function postIndex(req, res) {
    res.render('index', {
        email: req.session.email,
        username: req.session.username
    });
}

module.exports = { getIndex, postIndex }; 