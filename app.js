// MODULES
const express = require('express');
const { initDatabase } = require('./config/database/db');
const session = require('express-session');
const path = require('path');

initDatabase()
.then(() => {
    // VARIABLES
    const app = express();
    const hostname = '0.0.0.0';
    const port = 8080;

    // ROUTES

    app.set('view engine', 'ejs');
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.json());

    app.use(session({
        secret: process.env.SESSION_SECRET || 'supersecret',
        resave: false,
        saveUninitialized: true,
        cookie: { httpOnly: true, secure: false } 
    }));

    app.use('/', require('./entities/index/index_routes'));
    app.use('/auth', require('./entities/auth/auth_routes'));
    app.use('/user', require('./entities/user/user_routes'));

    app.use('/*', (req, res) => res.status(404).send("Lien non reconnu."));

    // LANCEMENT SERVEUR

    app.listen(port, hostname, () => {
        console.log(`Application en route sur http://${hostname}:${port}/`);
    });
})
.catch(err => console.error (err.stack));
