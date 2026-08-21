const express = require('express');
const router = express.Router();

const ventaController = require('../controllers/ventaController');

router.get('/', ventaController.index);
router.get('/nueva', ventaController.showCreateForm);
router.post('/', ventaController.create);
router.post('/:id/anular', ventaController.anular);
router.get('/:id', ventaController.show);

module.exports = router;
