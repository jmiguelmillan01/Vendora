const express = require('express');
const router = express.Router();
const ventaApiController = require('../../controllers/api/ventaApiController');

router.get('/', ventaApiController.index);
router.get('/:id', ventaApiController.show);
router.post('/', ventaApiController.create);
router.post('/:id/anular', ventaApiController.anular);

module.exports = router;
