const express = require('express');
const router = express.Router();

const controller = require('./auth_controller');

router.get('/inscription', controller.getRegistration)
router.get('/inscription/verification', controller.getRegistrationVerif);
router.post('/inscription/verification', controller.postRegistrationVerif);

router.get('/connexion', controller.getConnection);
router.get('/connexion/verification', controller.getConnectionVerif);
router.post('/connexion/verification', controller.postConnectionVerif);

router.get('/mdp_oublie', controller.getPasswordForgotten);
router.post('/mdp_oublie/succes', controller.postPasswordForgottenSuccess);

router.get('/deconnexion', controller.getDisconnection);

module.exports = router;
