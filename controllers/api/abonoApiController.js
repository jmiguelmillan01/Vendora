const Abono = require('../../models/Abono');
const Cliente = require('../../models/Cliente');
const { asyncHandler } = require('./_helpers');

const PER_PAGE = 10;
const METODOS_PAGO_VALIDOS = ['EFECTIVO', 'TRANSFERENCIA', 'OTRO'];

function parseFiltros(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const clienteId = query.clienteId ? parseInt(query.clienteId, 10) : '';
  const metodoPago = METODOS_PAGO_VALIDOS.includes(query.metodoPago) ? query.metodoPago : '';
  const fechaInicio = (query.fechaInicio || '').trim();
  const fechaFin = (query.fechaFin || '').trim();
  return { page, clienteId, metodoPago, fechaInicio, fechaFin };
}

function validarAbono(body) {
  const errores = [];

  if (!body.clienteId) {
    errores.push('Debes seleccionar un cliente.');
  }

  const valor = Number(body.valor);
  if (!body.valor || Number.isNaN(valor) || valor <= 0) {
    errores.push('El valor del abono debe ser mayor que cero.');
  }

  if (!METODOS_PAGO_VALIDOS.includes(body.metodoPago)) {
    errores.push('Debes seleccionar un método de pago válido.');
  }

  return errores;
}

const index = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const filtros = parseFiltros(req.query);
  const { abonos, total } = await Abono.findAll({ ...filtros, usuarioId, perPage: PER_PAGE });
  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));

  res.json({
    abonos,
    pagination: { page: filtros.page, perPage: PER_PAGE, total, totalPages: totalPaginas }
  });
});

const create = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const errores = validarAbono(req.body);
  const clienteId = parseInt(req.body.clienteId, 10);
  const valor = Number(req.body.valor);

  if (!errores.length) {
    const cliente = await Cliente.findById(clienteId, usuarioId);
    if (!cliente || !cliente.activo) {
      errores.push('El cliente seleccionado no existe o está inactivo.');
    } else {
      const resumen = await Cliente.getResumenFinanciero(clienteId, usuarioId);
      if (valor > resumen.saldo) {
        errores.push(`El abono no puede ser mayor al saldo pendiente (${resumen.saldo}).`);
      }
    }
  }

  if (errores.length) {
    return res.status(400).json({ errors: errores });
  }

  const abonoId = await Abono.create({
    usuarioId,
    clienteId,
    valor,
    metodoPago: req.body.metodoPago,
    observacion: (req.body.observacion || '').trim() || null
  });

  return res.status(201).json({ id: abonoId });
});

const anular = asyncHandler(async (req, res, next) => {
  try {
    await Abono.anular(req.params.id, req.usuarioId);
    return res.json({ message: 'Abono anulado correctamente.' });
  } catch (error) {
    if (error.validacion) {
      return res.status(422).json({ error: error.message });
    }
    return next(error);
  }
});

module.exports = { index, create, anular };
