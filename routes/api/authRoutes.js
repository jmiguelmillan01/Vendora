const express = require('express');
const router = express.Router();
const authApiController = require('../../controllers/api/authApiController');

router.post('/login', authApiController.login);
router.post('/registro', authApiController.registro);
router.post('/recuperar', authApiController.recuperar);
router.post('/recuperar/restablecer', authApiController.restablecer);

module.exports = router;
