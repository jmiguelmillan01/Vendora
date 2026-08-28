const express = require('express');
const router = express.Router();

const reporteController = require('../controllers/reporteController');

router.get('/', reporteController.index);
router.get('/exportar', reporteController.exportar);

module.exports = router;
