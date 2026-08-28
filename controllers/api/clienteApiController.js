const Cliente = require('../../models/Cliente');
const { asyncHandler } = require('./_helpers');

const PER_PAGE = 10;
const ORDEN_VALIDOS = ['nombre', 'reciente', 'saldo'];

function parseFiltros(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const search = (query.q || '').trim();
  const activo = query.activo === '1' || query.activo === '0' ? query.activo : '';
  const orderBy = ORDEN_VALIDOS.includes(query.orderBy) ? query.orderBy : 'nombre';
  const orderDir = query.orderDir === 'DESC' ? 'DESC' : 'ASC';
  return { page, search, activo, orderBy, orderDir };
}

function validarCliente(body) {
  const errores = [];
  const nombre = (body.nombre || '').trim();

  if (!nombre) {
    errores.push('El nombre es obligatorio.');
  } else if (nombre.length > 150) {
    errores.push('El nombre no puede superar los 150 caracteres.');
  }

  const email = (body.email || '').trim();
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errores.push('El correo electrónico no es válido.');
    } else if (email.length > 150) {
      errores.push('El correo electrónico no puede superar los 150 caracteres.');
    }
  }

  const telefono = (body.telefono || '').trim();
  if (telefono.length > 30) {
    errores.push('El teléfono no puede superar los 30 caracteres.');
  }

  const direccion = (body.direccion || '').trim();
  if (direccion.length > 255) {
    errores.push('La dirección no puede superar los 255 caracteres.');
  }

  const documento = (body.documento || '').trim();
  if (documento.length > 50) {
    errores.push('El documento no puede superar los 50 caracteres.');
  }

  return errores;
}

function datosClienteDesdeBody(body) {
  return {
    nombre: (body.nombre || '').trim(),
    telefono: (body.telefono || '').trim() || null,
    email: (body.email || '').trim() || null,
    direccion: (body.direccion || '').trim() || null,
    documento: (body.documento || '').trim() || null,
    observaciones: (body.observaciones || '').trim() || null
  };
}

const index = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const filtros = parseFiltros(req.query);
  const { clientes, total } = await Cliente.findAll({ ...filtros, usuarioId, perPage: PER_PAGE });
  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));

  res.json({
    clientes,
    pagination: { page: filtros.page, perPage: PER_PAGE, total, totalPages: totalPaginas }
  });
});

const show = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const cliente = await Cliente.findById(req.params.id, usuarioId);
  if (!cliente) {
    return res.status(404).json({ error: 'Cliente no encontrado.' });
  }

  const fechaInicio = (req.query.fechaInicio || '').trim();
  const fechaFin = (req.query.fechaFin || '').trim();

  const [resumen, historial] = await Promise.all([
    Cliente.getResumenFinanciero(req.params.id, usuarioId),
    Cliente.getHistorial(req.params.id, usuarioId, { fechaInicio, fechaFin })
  ]);

  return res.json({ cliente, resumen, historial });
});

const create = asyncHandler(async (req, res) => {
  const errores = validarCliente(req.body);
  if (errores.length) {
    return res.status(400).json({ errors: errores });
  }

  const id = await Cliente.create(datosClienteDesdeBody(req.body), req.usuarioId);
  const cliente = await Cliente.findById(id, req.usuarioId);
  return res.status(201).json({ cliente });
});

const update = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const cliente = await Cliente.findById(req.params.id, usuarioId);
  if (!cliente) {
    return res.status(404).json({ error: 'Cliente no encontrado.' });
  }

  const errores = validarCliente(req.body);
  if (errores.length) {
    return res.status(400).json({ errors: errores });
  }

  await Cliente.update(req.params.id, datosClienteDesdeBody(req.body), usuarioId);
  const actualizado = await Cliente.findById(req.params.id, usuarioId);
  return res.json({ cliente: actualizado });
});

const toggle = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const cliente = await Cliente.findById(req.params.id, usuarioId);
  if (!cliente) {
    return res.status(404).json({ error: 'Cliente no encontrado.' });
  }

  await Cliente.setActivo(req.params.id, !cliente.activo, usuarioId);
  const actualizado = await Cliente.findById(req.params.id, usuarioId);
  return res.json({ cliente: actualizado });
});

module.exports = { index, show, create, update, toggle };
