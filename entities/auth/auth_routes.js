const express = require('express');
const router = express.Router();

const controller = require('./auth_controller');

router.get('/inscription', controller.getRegistration)
router.get('/inscription/verification', controller.getRegistrationVerif);
router.post('/inscription/verification', controller.postRegistrationVerif);

router.get('/connexion', controller.getConnection);
router.get('/connexion/verification', controller.getConnectionVerif);
router.post('/connexion/verification', controller.postConnectionVerif);

router.get('/mot_de_passe_oublie', controller.getPasswordForgotten);
router.get('/mot_de_passe_oublie_succes', controller.getPasswordForgottenSuccess);
router.post('/mot_de_passe_oublie_succes', controller.postPasswordForgottenSuccess);

router.get('/mot_de_passe_reinitialisation', controller.getPasswordReset);
router.get('/mot_de_passe_reinitialisation/verification', controller.getPasswordResetVerif);
router.post('/mot_de_passe_reinitialisation/verification', controller.postPasswordResetVerif);

router.get('/deconnexion', controller.getDisconnection);

module.exports = router;
