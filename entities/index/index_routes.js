const express = require('express');
const router = express.Router();

const controller = require('./index_controller');

router.get('/', controller.getIndex);

router.get('/search', controller.getSearchProfil);

router.post('/create', controller.postCreateReunion);

router.get('/reponse/:reunion_id/:user_id', controller.getGetReponses);
router.post('/reponse', controller.postSendReponse);

router.get('/participants/:reunion_id', controller.getParticipantsLists);
router.post('/get-email', controller.postGetEmail);

router.post('/delete', controller.postDeleteReunion);
router.post('/leave', controller.postLeaveReunion);

router.post('/profil/:email', controller.postProfileParticipants);
router.post('/remove/:reunion_id/:email', controller.postDeleteParticipant);

router.post('/add-participant/:reunion_id', controller.postAddParticipant);

router.post('/all-responses', controller.postGetAllResponses); 

module.exports = router;
