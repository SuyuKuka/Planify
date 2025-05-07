const express = require('express');
const router = express.Router();

const controller = require('./index_controller');

router.get('/', controller.getIndex);

router.get('/search', controller.getSearchProfil);

router.post('/create', controller.postCreateReunion);

router.get('/reponse/:reunion_id/:user_id', controller.getGetReponses);
router.post('/reponse', controller.postSendReponse);

module.exports = router;
