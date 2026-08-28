const express = require('express');
const router = express.Router();
const dashboardApiController = require('../../controllers/api/dashboardApiController');

router.get('/', dashboardApiController.index);

module.exports = router;
