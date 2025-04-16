const express = require('express');
const router = express.Router();

const { getIndex } = require('./index_controller');

router.get('/', getIndex);

module.exports = router;
