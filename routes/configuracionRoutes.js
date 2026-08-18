const express = require('express');
const router = express.Router();

const configuracionController = require('../controllers/configuracionController');

router.get('/', configuracionController.showChangePassword);
router.post('/password', configuracionController.changePassword);

module.exports = router;
