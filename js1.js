// DEPENDANCES
const express = require('express');
const fs = require('fs');
const pg = require('pg');
const { titre } = require('process');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


// VARIABLES


const server = express();
const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'programmationwebprojet@gmail.com',
        pass: 'xzxk lzqe yrmu dhhn' 
    }
});

const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'planify',
    password: '2004',
    port: 5432
});
const hostname = '127.0.0.1';
const port = 8080;

server.set('view engine', 'ejs');
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, 'public')));


// FONCTIONS


function getDBPassword() {
    try {
        return fs.readFileSync('password.txt', 'utf8').trim();
    } catch (err) {
        console.error('Error: no such file or directory');
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

function generateToken() {
    return crypto.randomBytes(20).toString('hex');
}

async function saveResetToken(email) {
    const token = generateToken();
    const expirationDate = new Date(Date.now() + 5 * 60 * 1000); 

    const client = await pool.connect();
    try {
        await client.query("DELETE FROM token WHERE email = $1", [email]);
        await client.query("DELETE FROM token WHERE expire_at < NOW()");
        await client.query("INSERT INTO token (email, token, expire_at) VALUES ($1, $2, $3)", [email, token, expirationDate]);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
    return token;
}


// GET


server.get('/index', function (req, res) {
    res.render('index');
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

server.get('/mot_de_passe_oublie', function (req, res) {
    res.render('authentification', { 
        title: "Mot de passe oublie - Planify", 
        mode: "mot_de_passe_oublie", 
        email_oublie: ""
    });
});

server.get('/reinitialisation', async function (req, res) {
    const { token } = req.query;
    if (!token) {
        return res.redirect('/mot_de_passe_oublie'); 
    }
    
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM token WHERE token = $1 AND expire_at > NOW()", [token]);
        if (result.rows.length === 0) {
            return res.render('authentification', { 
                title: "Réinitialisation du mot de passe - Planify",
                mode: "reinitialisation", 
                erreur: "Le lien de réinitialisation est invalide ou a expiré."
            });
        }

        res.render('authentification', { 
            title: "Réinitialisation du mot de passe - Planify",
            mode: "reinitialisation", 
            token, 
            mdp_re: "",
            mdp_re2: ""
        });

    } catch (err) {
        console.error(err);
        return res.render('authentification', { 
            title: "Réinitialisation du mot de passe - Planify",
            mode: "reinitialisation", 
            erreur: "Une erreur est survenue, veuillez réessayer."
        });
    } finally {
        client.release();
    }
});


// POST


server.post('/index', async (req, res) => {
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
    } 
});

server.post('/connection', async (req, res) => {
    const { nom, prenom, date, pseudo, email, mdp } = req.body;
    if (nom && prenom && date && pseudo && email && mdp) {
        if (await ajouterUtilisateur(nom, prenom, date, pseudo, email, mdp)) {
            res.render('authentification', {
                title: "Connection - Planify",
                mode: "connection",
                email_co: email,
                mdp_co:""
            });
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
    }
});


server.post('/mot_de_passe_oublie', async (req, res) => {
    const { email_oublie } = req.body;
    
    let existe = false;
    const client = await pool.connect();
    try {
        let res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email_oublie]);
        if (res.rows.length > 0) {
            existe = true;
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
    if (existe) {
        try {
            const token = await saveResetToken(email_oublie);
            console.log(token);
            await transporter.sendMail({
                from: 'programmationwebprojet@gmail.com',
                to: email_oublie,
                subject: 'Réinitialisation de votre mot de passe',
                html: `<p>Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :</p>
                       <a href="http://localhost:8080/reinitialisation?token=${token}">Réinitialiser mon mot de passe</a>`
            });
            res.send("Un email de réinitialisation a été envoyé.");
        } catch (error) {
            console.error(error);
            res.send("Erreur lors de l'envoi de l'email.");
        }
    } else {
        res.render('authentification', { 
            title: "Mot de passe oublie - Planify",
            mode: "mot_de_passe_oublie", 
            email_oublie: "",
            erreur: "L'email n'existe pas."
        });
    }
});

server.post('/reinitialisation', async (req, res) => {
    const { token, mdp_re, mdp_re2 } = req.body;

    if (mdp_re !== mdp_re2) {
        return res.render('authentification', { 
            title: "Réinitialisation du mot de passe - Planify",
            mode: "reinitialisation", 
            mdp_re,
            mdp_re2,
            erreur: "Les mots de passe ne correspondent pas.",
            token
        });
    }
    const client = await pool.connect();
    try {
        const result = await client.query("SELECT * FROM token WHERE token = $1 AND expire_at > NOW()", [token]);

        if (result.rows.length === 0) {
            return res.render('authentification', { 
                title: "Réinitialisation du mot de passe - Planify",
                mode: "reinitialisation", 
                erreur: "Le lien de réinitialisation est invalide ou a expiré.",
                token
            });
        }

        const email = result.rows[0].email;
        await client.query("UPDATE utilisateur SET mot_de_passe = $1 WHERE email = $2", [mdp_re, email]);
        await client.query("DELETE FROM token WHERE email = $1", [email]);
        res.redirect('/connection', {
            title: "Connection - Planify",
            mode: "connection",
            email_co: email,
            mdp_co: ""
        });
    } catch (err) {
        console.error(err);
        return res.render('authentification', { 
            title: "Réinitialisation du mot de passe - Planify",
            mode: "reinitialisation", 
            erreur: "Une erreur est survenue, veuillez réessayer.",
            token
        });
    } finally {
        client.release();
    }
});


// LANCER LE SERVEUR


server.listen(port, hostname, () => {
    console.log(`Serveur est en route sur http://${hostname}:${port}/`);
});
