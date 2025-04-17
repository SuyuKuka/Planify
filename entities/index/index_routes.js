const express = require('express');
const router = express.Router();

const { getIndex, search, test } = require('./index_controller');

router.get('/', getIndex);

router.get('/search', search);

router.get('/test', test);

module.exports = router;
