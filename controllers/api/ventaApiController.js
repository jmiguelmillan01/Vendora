const Venta = require('../../models/Venta');
const { asyncHandler } = require('./_helpers');

const PER_PAGE = 10;
const METODOS_PAGO_VALIDOS = ['EFECTIVO', 'TRANSFERENCIA', 'OTRO'];
const ESTADOS_VALIDOS = ['PAGADA', 'PENDIENTE', 'PARCIAL', 'ANULADA'];

function parseFiltros(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const clienteId = query.clienteId ? parseInt(query.clienteId, 10) : '';
  const estado = ESTADOS_VALIDOS.includes(query.estado) ? query.estado : '';
  const fechaInicio = (query.fechaInicio || '').trim();
  const fechaFin = (query.fechaFin || '').trim();
  return { page, clienteId, estado, fechaInicio, fechaFin };
}

// La web arma `detalles` a partir de arrays paralelos producto_id[]/cantidad[]
// de un <form>; la API recibe el mismo concepto ya como JSON:
// detalles: [{ productoId, cantidad }].
function normalizarDetalles(body) {
  if (!Array.isArray(body.detalles)) {
    return [];
  }

  const detalles = [];
  for (const item of body.detalles) {
    const productoId = parseInt(item && item.productoId, 10);
    const cantidad = Number(item && item.cantidad);
    if (productoId && cantidad > 0) {
      detalles.push({ productoId, cantidad });
    }
  }
  return detalles;
}

function validarVenta(body, detalles) {
  const errores = [];

  if (!body.clienteId) {
    errores.push('Debes seleccionar un cliente.');
  }

  if (detalles.length === 0) {
    errores.push('Debes agregar al menos un producto o servicio con una cantidad válida.');
  }

  const descuento = Number(body.descuento || 0);
  if (Number.isNaN(descuento) || descuento < 0) {
    errores.push('El descuento debe ser un número mayor o igual a cero.');
  }

  const pagoInicial = Number(body.pagoInicial || 0);
  if (Number.isNaN(pagoInicial) || pagoInicial < 0) {
    errores.push('El pago inicial debe ser un número mayor o igual a cero.');
  }

  if (pagoInicial > 0 && !METODOS_PAGO_VALIDOS.includes(body.metodoPago)) {
    errores.push('Debes indicar un método de pago válido para el pago inicial.');
  }

  return errores;
}

const index = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const filtros = parseFiltros(req.query);
  const { ventas, total } = await Venta.findAll({ ...filtros, usuarioId, perPage: PER_PAGE });
  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));

  res.json({
    ventas,
    pagination: { page: filtros.page, perPage: PER_PAGE, total, totalPages: totalPaginas }
  });
});

const show = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const venta = await Venta.findById(req.params.id, usuarioId);
  if (!venta) {
    return res.status(404).json({ error: 'Venta no encontrada.' });
  }

  const detalles = await Venta.findDetalles(req.params.id, usuarioId);
  return res.json({ venta, detalles });
});

const create = asyncHandler(async (req, res, next) => {
  const usuarioId = req.usuarioId;
  const detalles = normalizarDetalles(req.body);
  const errores = validarVenta(req.body, detalles);

  if (errores.length) {
    return res.status(400).json({ errors: errores });
  }

  const pagoInicial = Number(req.body.pagoInicial || 0);

  try {
    const ventaId = await Venta.create({
      usuarioId,
      clienteId: parseInt(req.body.clienteId, 10),
      detalles,
      descuento: Number(req.body.descuento || 0),
      pagoInicial,
      metodoPago: pagoInicial > 0 ? req.body.metodoPago : null,
      observaciones: (req.body.observaciones || '').trim() || null
    });

    const venta = await Venta.findById(ventaId, usuarioId);
    return res.status(201).json({ venta });
  } catch (error) {
    if (error.validacion) {
      return res.status(422).json({ error: error.message });
    }
    return next(error);
  }
});

const anular = asyncHandler(async (req, res, next) => {
  try {
    await Venta.anular(req.params.id, req.usuarioId);
    const venta = await Venta.findById(req.params.id, req.usuarioId);
    return res.json({ venta });
  } catch (error) {
    if (error.validacion) {
      return res.status(422).json({ error: error.message });
    }
    return next(error);
  }
});

module.exports = { index, show, create, anular };
