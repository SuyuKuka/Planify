const express = require('express');
const router = express.Router();

const model = require('./auth_controller');

router.get('/inscription', model.getRegistration) // clique sur inscription
router.post('/inscription', model.postRegistration); // email deja utilisé

router.get('/connexion', model.getConnection); // clique sur connexion
router.post('/connexion', model.postConnection); // email + mdp = aucun user

router.get('/mdp_oublie', model.getPasswordForgotten); // clique sur mdp oublié

router.get('/deconnexion', model.getDisconnection); // déconnecte et redirige sur index

module.exports = router;
