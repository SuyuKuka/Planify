const express = require('express');
const server = express();
const fs = require('fs');
const pg = require('pg');
const { titre } = require('process');
const path = require('path');

const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'planify',
    password: '2004',
    port: 5432
});

const hostname = '127.0.0.1';
const port = 8080;

server.use(express.urlencoded({ extended: true }));
server.set('view engine', 'ejs');
server.use(express.static(path.join(__dirname, 'public')));

function getDBPassword() {
    try {
        return fs.readFileSync('password.txt', 'utf8').trim();
    } catch (err) {
        console.log('Error: no such file or directory');
        return "0";
    }
}

async function ajouterUtilisateur(nom, prenom, date, pseudo, email, mdp) {
    const client = await pool.connect();
    try {
        let res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
        if (res.rows.length > 0) {
            return false;
        }
        await client.query("INSERT INTO utilisateur (nom, prenom, date_de_naissance, pseudo, email, mot_de_passe) VALUES ($1, $2, $3, $4, $5, $6)", [nom, prenom, date, pseudo, email, mdp]);
        return true;
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

async function recupererUtilisateur(email_co, mdp_co) {
    const client = await pool.connect();
    try {
        let res = await client.query("SELECT * FROM utilisateur WHERE email = $1 AND mot_de_passe = $2", [email_co, mdp_co]);
        return res.rows.length > 0;
    } catch (err) {
        console.error(err);
        return false;
    } finally {
        client.release();
    }
}

server.get('/index', function (req, res) {
    res.render('authentification', { 
        title: "Connection - Planify", 
        mode: "connection", 
        email_co: "",
        mdp_co: "",
        erreur: ""
     });
});

server.get('/connection', function (req, res) {
    res.render('authentification', { 
        title: "Connection - Planify", 
        mode: "connection", 
        email_co: "",
        mdp_co: "",
        erreur: "" 
    });
});

server.get('/inscription', function (req, res) {
    res.render('authentification', { 
        title: "Inscription - Planify", 
        mode: "inscription", 
        nom: "", 
        prenom: "",
        date: "",
        pseudo: "",
        email: "",
        mdp: "",
        erreur: ""
    });
});

server.post('/connection', async (req, res) => {
    const { email_co, mdp_co } = req.body;
    if (email_co && mdp_co) {
        if (await recupererUtilisateur(email_co, mdp_co)) {
            res.render('index');
        } else {
            res.render('authentification', { 
                title: "Connection - Planify",
                mode: "connection",
                email_co, 
                mdp_co,
                erreur: "Email ou mot de passe incorrect."
            });
        }
    } else {
        res.render('authentification', { 
            title: "Connection - Planify",
            mode: "connection",
            email_co, 
            mdp_co,
            erreur: ""
        });
    }
});

server.post('/inscription', async (req, res) => {
    const { nom, prenom, date, pseudo, email, mdp } = req.body;
    if (nom && prenom && date && pseudo && email && mdp) {
        if (await ajouterUtilisateur(nom, prenom, date, pseudo, email, mdp)) {
            res.render('index');
        } else {
            res.render('authentification', { 
                title: "Inscription - Planify",
                mode: "inscription",
                nom, 
                prenom, 
                date, 
                pseudo, 
                email, 
                mdp,
                erreur: "Cet email a déjà été utilisé.",
                step: 2
            });
        }
    } else {
        res.render('authentification', { 
            title: "Inscription - Planify",
            mode: "inscription",
            nom, 
            prenom, 
            date, 
            pseudo, 
            email, 
            mdp,
            erreur: ""
        });
    }
});

server.listen(port, hostname, () => {
    console.log(`Serveur est en route sur http://${hostname}:${port}/`);
});
