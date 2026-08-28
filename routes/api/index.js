const express = require('express');
const router = express.Router();
const { apiAuth } = require('../../middleware/apiAuthMiddleware');

// Sin auth: login, registro y recuperación de contraseña.
router.use('/auth', require('./authRoutes'));

// Todo lo de abajo requiere JWT válido (equivalente móvil de requireAuth).
router.use(apiAuth);

router.use('/clientes', require('./clienteRoutes'));
router.use('/productos', require('./productoRoutes'));
router.use('/ventas', require('./ventaRoutes'));
router.use('/abonos', require('./abonoRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/reportes', require('./reporteRoutes'));

router.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado.' });
});

// Manejador de errores propio de /api/v1: la app web usa res.render('500', ...),
// que no sirve para un cliente JSON como la app móvil. Nunca se filtra
// error.message aquí salvo que sea un error de validación de negocio
// (error.validacion), que ya se maneja en cada controlador antes de llegar aquí.
router.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = router;
