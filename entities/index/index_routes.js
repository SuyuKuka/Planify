const express = require('express');
const router = express.Router();

const controller = require('./index_controller');

router.get('/', controller.getIndex);

router.get('/search', controller.getSearchProfil);

router.post('/create', controller.postCreateReunion);

router.post('/get-slots', controller.postGetSlots);

router.get('/reponse/:reunion_id/:user_id', controller.getGetReponses);
router.post('/reponse', controller.postSendReponse);

router.get('/participants/:reunion_id', controller.getParticipantsLists);
router.post('/get-email', controller.postGetEmail);

router.post('/delete', controller.postDeleteReunion);
router.post('/leave', controller.postLeaveReunion);

router.post('/profil', controller.postProfileParticipants);
router.post('/remove', controller.postDeleteParticipant);

router.post('/add-participant/:reunion_id', controller.postAddParticipant);

router.post('/all-responses', controller.postGetAllResponses); 

router.post('/delete-slot', controller.postDeleteSlot);
router.post('/add-slot', controller.postAddSlot);

router.get('/reunion/:token', controller.getParticipateReunion);

router.post('/insert-ics', controller.postInsertICS);

module.exports = router;
