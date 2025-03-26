const express = require('express');
const router = express.Router();

const { getIndex, postIndex } = require('./index_controller');

router.get('/', getIndex);
router.post('/', postIndex);

module.exports = router;
