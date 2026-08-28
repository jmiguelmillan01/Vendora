const express = require('express');
const router = express.Router();
const reporteApiController = require('../../controllers/api/reporteApiController');

router.get('/ventas', reporteApiController.ventas);
router.get('/abonos', reporteApiController.abonos);
router.get('/clientes', reporteApiController.clientes);
router.get('/productos', reporteApiController.productos);

router.get('/ventas/exportar', reporteApiController.exportarVentas);
router.get('/abonos/exportar', reporteApiController.exportarAbonos);
router.get('/clientes/exportar', reporteApiController.exportarClientes);
router.get('/productos/exportar', reporteApiController.exportarProductos);
router.get('/exportar', reporteApiController.exportarTodo);

module.exports = router;
