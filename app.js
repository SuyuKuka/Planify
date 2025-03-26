// MODULES
const express = require('express');
const pg = require('pg');
const session = require('express-session');
const path = require('path');
const { generateToken } = require('./services/encryption/encrypt');

// VARIABLES

const app = express();
const hostname = '127.0.0.1';
const port = 8080;


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: generateToken(),
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, secure: false } 
}));

app.get('/', require('./entities/index/index_routes'));
app.use('/auth', require('./entities/auth/auth_routes'));
app.use('user', require('./entities/user/user_routes'));

app.use('/*', (req, res) => res.status(404).send("Lien non reconnu."));

app.listen(port, hostname, () => {
    console.log(`Serveur est en route sur http://${hostname}:${port}/`);
});


// FONCTIONS


// function getDBPassword() {
//     try {
//         return fs.readFileSync(path.join(__dirname, 'password.txt'), 'utf8').trim();
//     } catch (err) {
//         return "";
//     }
// }

// async function ajouterUtilisateur(nom, prenom, date, pseudo, email, mdp) {
//     let client = await pool.connect();
//     try {
//         let res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email]);
//         if (res.rows.length > 0) {
//             return false;
//         }
//         await client.query("INSERT INTO utilisateur (nom, prenom, date_de_naissance, pseudo, email, mot_de_passe) VALUES ($1, $2, $3, $4, $5, $6)", [nom, prenom, date, pseudo, email, mdp]);
//         return true;
//     } catch (err) {
//         console.error(err);
//     } finally {
//         client.release();
//     }
// }

// async function recupererUtilisateur(email_co, mdp_co) {
//     let client = await pool.connect();
//     try {
//         let res = await client.query("SELECT * FROM utilisateur WHERE email = $1 AND mot_de_passe = $2", [email_co, mdp_co]);
//         return res.rows.length > 0;
//     } catch (err) {
//         console.error(err);
//         return false;
//     } finally {
//         client.release();
//     }
// }

// async function modifierUtilisateur(pseudo, email, mdp) {
//     let client = await pool.connect();
//     try {
//         await client.query("UPDATE utilisateur SET pseudo = $1, email = $2, mot_de_passe = $3 WHERE email = $4", [pseudo, email, mdp, email]);
//     } catch (err) {
//         console.error(err);
//         return false;
//     } finally {
//         client.release();
//     }
//     return true;
// }


// function generateToken() {
//     return crypto.randomBytes(20).toString('hex');
// }

// async function saveResetToken(email) {
//     let token = generateToken();
//     let expirationDate = new Date(Date.now() + 5 * 60 * 1000); 

//     let client = await pool.connect();
//     try {
//         await client.query("DELETE FROM token WHERE email = $1", [email]);
//         await client.query("DELETE FROM token WHERE expire_at < NOW()");
//         await client.query("INSERT INTO token (email, token, expire_at) VALUES ($1, $2, $3)", [email, token, expirationDate]);
//     } catch (err) {
//         console.error(err);
//     } finally {
//         client.release();
//     }
//     return token;
// }

// GET


// app.get('/index', function (req, res) {
//     res.render('index', {
//         email: req.session.email, 
//         pseudo: req.session.pseudo
//     });
// });

// app.get('/parametres', function (req, res) {
//     if (typeof req.session.email === 'undefined' || typeof req.session.pseudo === 'undefined') {
//         res.redirect('/connexion');
//     } else {
//         res.render('parametres', {
//             email: req.session.email, 
//             pseudo: req.session.pseudo
//         });
//     }
// });

// app.get('/connexion', function (req, res) {
//     res.render('authentification', { 
//         title: "Connexion - Planify", 
//         mode: "connexion", 
//         email_co: "",
//         mdp_co: ""
//     });
// });

// app.get('/inscription', function (req, res) {
//     res.render('authentification', { 
//         title: "Inscription - Planify", 
//         mode: "inscription", 
//         nom: "", 
//         prenom: "",
//         date: "",
//         pseudo: "",
//         email: "",
//         mdp: ""
//     });
// });

// app.get('/mot_de_passe_oublie', function (req, res) {
//     res.render('authentification', { 
//         title: "Mot de passe oublie - Planify", 
//         mode: "mot_de_passe_oublie", 
//         email_oublie: ""
//     });
// });

// app.get('/reinitialisation', async function (req, res) {
//     let { token } = req.query;
//     if (!token) {
//         return res.redirect('/mot_de_passe_oublie'); 
//     }
    
//     let client = await pool.connect();
//     try {
//         let result = await client.query("SELECT * FROM token WHERE token = $1 AND expire_at > NOW()", [token]);
//         if (result.rows.length === 0) {
//             return res.render('authentification', { 
//                 title: "Réinitialisation du mot de passe - Planify",
//                 mode: "reinitialisation", 
//                 erreur: "Le lien de réinitialisation est invalide ou a expiré."
//             });
//         }

//         res.render('authentification', { 
//             title: "Réinitialisation du mot de passe - Planify",
//             mode: "reinitialisation", 
//             token, 
//             mdp_re: "",
//             mdp_re2: ""
//         });

//     } catch (err) {
//         console.error(err);
//         return res.render('authentification', { 
//             title: "Réinitialisation du mot de passe - Planify",
//             mode: "reinitialisation", 
//             erreur: "Une erreur est survenue, veuillez réessayer."
//         });
//     } finally {
//         client.release();
//     }
// });


// // POST

// app.post('/index', async (req, res) => {
//     let { email_co, mdp_co } = req.body;
//     if (email_co && mdp_co) {
//         if (await recupererUtilisateur(email_co, mdp_co)) {
//             let client = await pool.connect();
//             let p = await client.query("SELECT pseudo FROM utilisateur WHERE email = $1", [email_co]);
//             req.session.email = email_co;
//             req.session.pseudo = p.rows[0].pseudo; 
//             res.render('index', {
//                 email: req.session.email,
//                 pseudo: req.session.pseudo
//             });
//         } else {
//             res.render('authentification', { 
//                 title: "Connexion - Planify",
//                 mode: "connexion",
//                 email_co, 
//                 mdp_co,
//                 erreur: "Email ou mot de passe incorrect."
//             });
//         }
//     } 
// });

// app.post('/parametres', async (req, res) => {
//     let { pseudo, email, mdp } = req.body;
    
//     if (pseudo && email && mdp) {
//         // if sur le mdp
//         // faire un autre input pour le mdp nouveau 
        
//         // bouton de déco post ou get => 
//         // req.session.destroy(function(err) {
//         //     if (err) {
//         //         console.log(err);
//         //     }
//         //     res.clearCookie('connect.sid'); 
//         // });
//         if (await modifierUtilisateur(pseudo, email, mdp)) {
//             let client = await pool.connect();
//             let data = await client.query("SELECT pseudo, email FROM utilisateur WHERE email = $1", [email]);
//             req.session.pseudo = data.rows[0].pseudo;
//             req.session.email = data.rows[0].email;

//             res.redirect('/index');
//         } else {
//             res.render('parametres', { 
//                 email: req.session.email, 
//                 pseudo: req.session.pseudo,
//                 erreur: "Email ou mot de passe incorrect."
//             });
//         }
//     }
// });

// app.post('/connexion', async (req, res) => {
//     let { nom, prenom, date, pseudo, email, mdp } = req.body;
//     if (nom && prenom && date && pseudo && email && mdp) {
//         if (await ajouterUtilisateur(nom, prenom, date, pseudo, email, mdp)) {
//             res.render('authentification', {
//                 title: "Connexion - Planify",
//                 mode: "connexion",
//                 email_co: email,
//                 mdp_co:""
//             });
//         } else {
//             res.render('authentification', { 
//                 title: "Inscription - Planify",
//                 mode: "inscription",
//                 nom, 
//                 prenom, 
//                 date, 
//                 pseudo, 
//                 email, 
//                 mdp,
//                 erreur: "Cet email a déjà été utilisé.",
//                 step: 2
//             });
//         }
//     }
// });


// app.post('/mot_de_passe_oublie', async (req, res) => {
//     let { email_oublie } = req.body;
    
//     let existe = false;
//     let client = await pool.connect();
//     try {
//         let res = await client.query("SELECT * FROM utilisateur WHERE email = $1", [email_oublie]);
//         if (res.rows.length > 0) {
//             existe = true;
//         }
//     } catch (err) {
//         console.error(err);
//     } finally {
//         client.release();
//     }
//     if (existe) {
//         try {
//             let token = await saveResetToken(email_oublie);
//             await transporter.sendMail({
//                 from: 'programmationwebprojet@gmail.com',
//                 to: email_oublie,
//                 subject: 'Réinitialisation de votre mot de passe',
//                 html: `<p>Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :</p>
//                        <a href="http://localhost:8080/reinitialisation?token=${token}">Réinitialiser mon mot de passe</a>`
//             });
//             res.send("Un email de réinitialisation a été envoyé.");
//         } catch (error) {
//             console.error(error);
//             res.send("Erreur lors de l'envoi de l'email.");
//         }
//     } else {
//         res.render('authentification', { 
//             title: "Mot de passe oublie - Planify",
//             mode: "mot_de_passe_oublie", 
//             email_oublie: "",
//             erreur: "L'email n'existe pas."
//         });
//     }
// });

// app.post('/reinitialisation', async (req, res) => {
//     let { token, mdp_re, mdp_re2 } = req.body;

//     if (mdp_re !== mdp_re2) {
//         return res.render('authentification', { 
//             title: "Réinitialisation du mot de passe - Planify",
//             mode: "reinitialisation", 
//             mdp_re,
//             mdp_re2,
//             erreur: "Les mots de passe ne correspondent pas.",
//             token
//         });
//     }
//     let client = await pool.connect();
//     try {
//         let result = await client.query("SELECT * FROM token WHERE token = $1 AND expire_at > NOW()", [token]);

//         if (result.rows.length === 0) {
//             return res.render('authentification', { 
//                 title: "Réinitialisation du mot de passe - Planify",
//                 mode: "reinitialisation", 
//                 erreur: "Le lien de réinitialisation est invalide ou a expiré.",
//                 token
//             });
//         }

//         let email = result.rows[0].email;
//         await client.query("UPDATE utilisateur SET mot_de_passe = $1 WHERE email = $2", [mdp_re, email]);
//         await client.query("DELETE FROM token WHERE email = $1", [email]);
//         res.redirect('/connexion', {
//             title: "Connexion - Planify",
//             mode: "connexion",
//             email_co: email,
//             mdp_co: ""
//         });
//     } catch (err) {
//         console.error(err);
//         return res.render('authentification', { 
//             title: "Réinitialisation du mot de passe - Planify",
//             mode: "reinitialisation", 
//             erreur: "Une erreur est survenue, veuillez réessayer.",
//             token
//         });
//     } finally {
//         client.release();
//     }
// });


// LANCER LE SERVEUR


// app.listen(port, hostname, () => {
//     console.log(`Serveur est en route sur http://${hostname}:${port}/`);
// });
