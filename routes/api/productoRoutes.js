const express = require('express');
const router = express.Router();
const productoApiController = require('../../controllers/api/productoApiController');

router.get('/', productoApiController.index);
router.get('/:id', productoApiController.show);
router.post('/', productoApiController.create);
router.put('/:id', productoApiController.update);
router.post('/:id/toggle', productoApiController.toggle);

module.exports = router;
