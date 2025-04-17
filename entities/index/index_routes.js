const express = require('express');
const router = express.Router();

const { getIndex, search } = require('./index_controller');

router.get('/', getIndex);

router.get('/search', search);

module.exports = router;
