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
    console.log("test");
    try {
        console.log("insert");
        await client.query("INSERT INTO utilisateur (nom, prenom, date_de_naissance, pseudo, email, mot_de_passe) VALUES ($1, $2, $3, $4, $5, $6)", [nom, prenom, date, pseudo, email, mdp]);
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
        if (res.rows.length > 0) {
            console.log("BON EMAIL ET MDP");
        } else {
            console.log("NOP");
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

server.get('/index', function (req, res) {
    res.render('authentification', { 
        title: "Connection - Planify", 
        mode: "connection", 
        email_co: "",
        mdp_co: ""
     });
});

server.get('/connection', function (req, res) {
    res.render('authentification', { 
        title: "Connection - Planify", 
        mode: "connection", 
        email_co: "",
        mdp_co: ""
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
        mdp: ""
    });
});

// faut juste pas mettre index donc j'ai mis /
server.post('/', async (req, res) => {
    const { email_co, mdp_co } = req.body;
    if (email_co && mdp_co) {
        await recupererUtilisateur(email_co, mdp_co);
    } else {
        res.render('authentification', { 
            title: "Connection - Planify",
            mode: "connection",
            email_co, 
            mdp_co
        });
    }
});

server.post('/connection', async (req, res) => {
    const { nom, prenom, date, pseudo, email, mdp } = req.body;
    if (nom && prenom && date && pseudo && email && mdp) {
        await ajouterUtilisateur(nom, prenom, date, pseudo, email, mdp);
    } else {
        res.render('authentification', { 
            title: "Inscription - Planify",
            mode: "inscription",
            nom, 
            prenom, 
            date, 
            pseudo, 
            email, 
            mdp 
        });
    }
});

server.post('/index', async(req, res) => {
    res.render('index');
});

server.listen(port, hostname, () => {
    console.log(`Serveur est en route sur http://${hostname}:${port}/`);
});
