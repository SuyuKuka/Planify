const express = require('express');
const router = express.Router();
const { upload } = require('../../services/upload/upload');

const controller = require('./user_controller');

router.get('/profil', controller.getProfile);
router.post('/profil', upload.single('profile_picture'), controller.postProfile);

router.get('/parametres', controller.getParameters);

router.get('/parametres/verification', controller.getParametersChangesVerif);
router.post('/parametres/verification', controller.postParametersChangesVerif);

module.exports = router;
