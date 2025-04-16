const express = require('express');
const router = express.Router();

const controller = require('./user_controller');

router.get('/', controller.getProfile);

router.get('/parametres', controller.getParameters);

router.get('/parametres/verification', controller.getParametersChangesVerif);
router.post('/parametres/verification', controller.postParametersChangesVerif);

module.exports = router;
