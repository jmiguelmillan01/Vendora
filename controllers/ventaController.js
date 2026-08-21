const Venta = require('../models/Venta');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');
const { buildQueryString } = require('../utils/query');

const PER_PAGE = 10;
const METODOS_PAGO_VALIDOS = ['EFECTIVO', 'TRANSFERENCIA', 'OTRO'];
const ESTADOS_VALIDOS = ['PAGADA', 'PENDIENTE', 'PARCIAL', 'ANULADA'];

function parseFiltros(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const clienteId = query.cliente_id ? parseInt(query.cliente_id, 10) : '';
  const estado = ESTADOS_VALIDOS.includes(query.estado) ? query.estado : '';
  const fechaInicio = (query.fechaInicio || '').trim();
  const fechaFin = (query.fechaFin || '').trim();
  return { page, clienteId, estado, fechaInicio, fechaFin };
}

function normalizarDetalles(body) {
  const productoIds = Array.isArray(body.producto_id) ? body.producto_id : [body.producto_id].filter(Boolean);
  const cantidades = Array.isArray(body.cantidad) ? body.cantidad : [body.cantidad].filter(Boolean);

  const detalles = [];
  for (let i = 0; i < productoIds.length; i += 1) {
    const productoId = parseInt(productoIds[i], 10);
    const cantidad = Number(cantidades[i]);
    if (productoId && cantidad > 0) {
      detalles.push({ productoId, cantidad });
    }
  }
  return detalles;
}

function validarVenta(body, detalles) {
  const errores = [];

  if (!body.cliente_id) {
    errores.push('Debes seleccionar un cliente.');
  }

  if (detalles.length === 0) {
    errores.push('Debes agregar al menos un producto o servicio con una cantidad válida.');
  }

  const descuento = Number(body.descuento || 0);
  if (Number.isNaN(descuento) || descuento < 0) {
    errores.push('El descuento debe ser un número mayor o igual a cero.');
  }

  const pagoInicial = Number(body.pago_inicial || 0);
  if (Number.isNaN(pagoInicial) || pagoInicial < 0) {
    errores.push('El pago inicial debe ser un número mayor o igual a cero.');
  }

  if (pagoInicial > 0 && !METODOS_PAGO_VALIDOS.includes(body.metodo_pago)) {
    errores.push('Debes indicar un método de pago válido para el pago inicial.');
  }

  return errores;
}

async function index(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const filtros = parseFiltros(req.query);
    const { ventas, total } = await Venta.findAll({ ...filtros, usuarioId, perPage: PER_PAGE });
    const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));
    const clientes = await Cliente.findActivos(usuarioId);

    res.render('ventas/index', {
      titulo: 'Ventas',
      activeNav: 'ventas',
      ventas,
      clientes,
      filtros,
      queryString: buildQueryString(req.query),
      paginacion: { paginaActual: filtros.page, totalPaginas, total, entidad: 'ventas' }
    });
  } catch (error) {
    next(error);
  }
}

async function showCreateForm(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const [clientes, productos] = await Promise.all([
      Cliente.findActivos(usuarioId),
      Producto.findActivos(usuarioId)
    ]);

    res.render('ventas/nueva', {
      titulo: 'Nueva venta',
      activeNav: 'ventas',
      clientes,
      productos,
      errores: [],
      valores: { cliente_id: '', descuento: '0', pago_inicial: '0', metodo_pago: '', observaciones: '' }
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  const usuarioId = req.session.usuario.id;
  try {
    const detalles = normalizarDetalles(req.body);
    const errores = validarVenta(req.body, detalles);

    if (errores.length) {
      const [clientes, productos] = await Promise.all([Cliente.findActivos(usuarioId), Producto.findActivos(usuarioId)]);
      return res.status(400).render('ventas/nueva', {
        titulo: 'Nueva venta',
        activeNav: 'ventas',
        clientes,
        productos,
        errores,
        valores: req.body
      });
    }

    const pagoInicial = Number(req.body.pago_inicial || 0);

    const ventaId = await Venta.create({
      usuarioId,
      clienteId: parseInt(req.body.cliente_id, 10),
      detalles,
      descuento: Number(req.body.descuento || 0),
      pagoInicial,
      metodoPago: pagoInicial > 0 ? req.body.metodo_pago : null,
      observaciones: (req.body.observaciones || '').trim() || null
    });

    req.session.flash = { type: 'success', message: 'Venta registrada correctamente.' };
    res.redirect(`/ventas/${ventaId}`);
  } catch (error) {
    if (error.validacion) {
      const [clientes, productos] = await Promise.all([Cliente.findActivos(usuarioId), Producto.findActivos(usuarioId)]);
      return res.status(400).render('ventas/nueva', {
        titulo: 'Nueva venta',
        activeNav: 'ventas',
        clientes,
        productos,
        errores: [error.message],
        valores: req.body
      });
    }
    next(error);
  }
}

async function show(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const venta = await Venta.findById(req.params.id, usuarioId);
    if (!venta) {
      return res.status(404).render('404', { titulo: 'Venta no encontrada' });
    }

    const detalles = await Venta.findDetalles(req.params.id, usuarioId);

    res.render('ventas/show', {
      titulo: `Venta #${venta.id}`,
      activeNav: 'ventas',
      venta,
      detalles
    });
  } catch (error) {
    next(error);
  }
}

async function anular(req, res, next) {
  try {
    await Venta.anular(req.params.id, req.session.usuario.id);
    req.session.flash = { type: 'success', message: 'Venta anulada correctamente.' };
    res.redirect(`/ventas/${req.params.id}`);
  } catch (error) {
    if (error.validacion) {
      req.session.flash = { type: 'error', message: error.message };
      return res.redirect(`/ventas/${req.params.id}`);
    }
    next(error);
  }
}

module.exports = {
  index,
  showCreateForm,
  create,
  show,
  anular
};
