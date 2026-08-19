const Abono = require('../models/Abono');
const Cliente = require('../models/Cliente');
const { buildQueryString } = require('../utils/query');
const { formatMoney } = require('../utils/format');

const PER_PAGE = 10;
const METODOS_PAGO_VALIDOS = ['EFECTIVO', 'TRANSFERENCIA', 'OTRO'];

function parseFiltros(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const clienteId = query.cliente_id ? parseInt(query.cliente_id, 10) : '';
  const metodoPago = METODOS_PAGO_VALIDOS.includes(query.metodo_pago) ? query.metodo_pago : '';
  const fechaInicio = (query.fechaInicio || '').trim();
  const fechaFin = (query.fechaFin || '').trim();
  return { page, clienteId, metodoPago, fechaInicio, fechaFin };
}

async function index(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const filtros = parseFiltros(req.query);
    const { abonos, total } = await Abono.findAll({ ...filtros, usuarioId, perPage: PER_PAGE });
    const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));
    const clientes = await Cliente.findActivos(usuarioId);

    res.render('abonos/index', {
      titulo: 'Abonos',
      activeNav: 'abonos',
      abonos,
      clientes,
      filtros,
      queryString: buildQueryString(req.query),
      paginacion: { paginaActual: filtros.page, totalPaginas, total, entidad: 'abonos' }
    });
  } catch (error) {
    next(error);
  }
}

async function showCreateForm(req, res, next) {
  try {
    const clientes = await Cliente.findActivosConSaldo(req.session.usuario.id);
    const clienteIdQuery = req.query.cliente_id ? parseInt(req.query.cliente_id, 10) : '';

    res.render('abonos/nueva', {
      titulo: 'Nuevo abono',
      activeNav: 'abonos',
      clientes,
      errores: [],
      valores: {
        cliente_id: clienteIdQuery || '',
        valor: '',
        metodo_pago: '',
        observacion: ''
      }
    });
  } catch (error) {
    next(error);
  }
}

function validarAbono(body) {
  const errores = [];

  if (!body.cliente_id) {
    errores.push('Debes seleccionar un cliente.');
  }

  const valor = Number(body.valor);
  if (!body.valor || Number.isNaN(valor) || valor <= 0) {
    errores.push('El valor del abono debe ser mayor que cero.');
  }

  if (!METODOS_PAGO_VALIDOS.includes(body.metodo_pago)) {
    errores.push('Debes seleccionar un método de pago válido.');
  }

  return errores;
}

async function create(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const errores = validarAbono(req.body);
    const clienteId = parseInt(req.body.cliente_id, 10);
    const valor = Number(req.body.valor);

    if (!errores.length) {
      const cliente = await Cliente.findById(clienteId, usuarioId);
      if (!cliente || !cliente.activo) {
        errores.push('El cliente seleccionado no existe o está inactivo.');
      } else {
        const resumen = await Cliente.getResumenFinanciero(clienteId, usuarioId);
        if (valor > resumen.saldo) {
          errores.push(`El abono no puede ser mayor al saldo pendiente (${formatMoney(resumen.saldo)}).`);
        }
      }
    }

    if (errores.length) {
      const clientes = await Cliente.findActivosConSaldo(usuarioId);
      return res.status(400).render('abonos/nueva', {
        titulo: 'Nuevo abono',
        activeNav: 'abonos',
        clientes,
        errores,
        valores: req.body
      });
    }

    await Abono.create({
      usuarioId,
      clienteId,
      valor,
      metodoPago: req.body.metodo_pago,
      observacion: (req.body.observacion || '').trim() || null
    });

    req.session.flash = { type: 'success', message: 'Abono registrado correctamente.' };
    res.redirect(`/clientes/${clienteId}`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  showCreateForm,
  create
};
