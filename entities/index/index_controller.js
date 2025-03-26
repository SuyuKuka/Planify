function getIndex(req, res) {
    res.render('index', {
        email: req.session.email,
        pseudo: req.session.pseudo
    });
}

function postIndex(req, res) {
    res.render('index', {
        email: req.session.email,
        pseudo: req.session.pseudo
    });
}

module.exports = { getIndex, postIndex }; 