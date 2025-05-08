const express = require('express');
const router = express.Router();

const controller = require('./index_controller');

router.get('/', controller.getIndex);

router.get('/search', controller.getSearchProfil);

router.post('/create', controller.postCreateReunion);

router.get('/reponse/:reunion_id/:user_id', controller.getGetReponses);
router.post('/reponse', controller.postSendReponse);

router.get('/participants/:reunion_id', controller.getParticipantsLists);

router.get('/delete/:reunion_id', controller.getDeleteReunion);
router.get('/leave/:reunion_id', controller.getLeaveReunion);

router.get('/profil/:email', controller.getProfileParticipants);
router.get('/remove/:reunion_id/:email', controller.getDeleteParticipant);

module.exports = router;
