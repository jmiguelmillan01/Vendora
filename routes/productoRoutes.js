const express = require('express');
const router = express.Router();

const productoController = require('../controllers/productoController');

router.get('/', productoController.index);
router.get('/nuevo', productoController.showCreateForm);
router.post('/', productoController.create);
router.get('/:id/editar', productoController.showEditForm);
router.post('/:id', productoController.update);
router.post('/:id/toggle', productoController.toggleActivo);

module.exports = router;
