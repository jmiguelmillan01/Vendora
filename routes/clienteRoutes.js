const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.index);
router.get('/nuevo', clienteController.showCreateForm);
router.post('/', clienteController.create);
router.get('/:id/editar', clienteController.showEditForm);
router.post('/:id', clienteController.update);
router.post('/:id/toggle', clienteController.toggleActivo);
router.get('/:id', clienteController.show);

module.exports = router;
