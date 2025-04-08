function getIndex(req, res) {
    console.log(req.session + "GET INDEX");
    console.log(req.session);
    console.log(req.session.email);
    console.log(req.session.username);
    console.log(req.session.surname);
    console.log(req.session.name);
    console.log(req.session.birthdate);
    console.log(req.session.test);
    res.render('index', {
        email: req.session.email,
        username: req.session.username
    });
}

function postIndex(req, res) {
    console.log(req.session + "POST INDEX");
    console.log(req.session);
    console.log(req.session.email);
    console.log(req.session.username);
    console.log(req.session.surname);
    console.log(req.session.name);
    console.log(req.session.birthdate);
    console.log(req.session.test);
    res.render('index', {
        email: req.session.email,
        username: req.session.username
    });
}

module.exports = { getIndex, postIndex }; 