const express = require('express');
const router = express.Router();
const clienteApiController = require('../../controllers/api/clienteApiController');

router.get('/', clienteApiController.index);
router.get('/:id', clienteApiController.show);
router.post('/', clienteApiController.create);
router.put('/:id', clienteApiController.update);
router.post('/:id/toggle', clienteApiController.toggle);

module.exports = router;
