const Producto = require('../../models/Producto');
const { asyncHandler } = require('./_helpers');

const PER_PAGE = 10;
const ORDEN_VALIDOS = ['nombre', 'reciente', 'precio'];

function parseFiltros(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const search = (query.q || '').trim();
  const tipo = query.tipo === 'producto' || query.tipo === 'servicio' ? query.tipo : '';
  const activo = query.activo === '1' || query.activo === '0' ? query.activo : '';
  const orderBy = ORDEN_VALIDOS.includes(query.orderBy) ? query.orderBy : 'nombre';
  const orderDir = query.orderDir === 'DESC' ? 'DESC' : 'ASC';
  return { page, search, tipo, activo, orderBy, orderDir };
}

function validarProducto(body) {
  const errores = [];
  const nombre = (body.nombre || '').trim();
  const precio = body.precio;

  if (!nombre) {
    errores.push('El nombre es obligatorio.');
  } else if (nombre.length > 150) {
    errores.push('El nombre no puede superar los 150 caracteres.');
  }

  if (body.tipo !== 'producto' && body.tipo !== 'servicio') {
    errores.push('Debes seleccionar un tipo válido (producto o servicio).');
  }

  if (precio === undefined || precio === null || precio === '') {
    errores.push('El precio es obligatorio.');
  } else if (Number.isNaN(Number(precio)) || Number(precio) < 0) {
    errores.push('El precio debe ser un número mayor o igual a cero.');
  }

  return errores;
}

function datosProductoDesdeBody(body) {
  return {
    nombre: (body.nombre || '').trim(),
    descripcion: (body.descripcion || '').trim() || null,
    tipo: body.tipo === 'servicio' ? 'servicio' : 'producto',
    precio: Number(body.precio)
  };
}

const index = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const filtros = parseFiltros(req.query);
  const { productos, total } = await Producto.findAll({ ...filtros, usuarioId, perPage: PER_PAGE });
  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));

  res.json({
    productos,
    pagination: { page: filtros.page, perPage: PER_PAGE, total, totalPages: totalPaginas }
  });
});

const show = asyncHandler(async (req, res) => {
  const producto = await Producto.findById(req.params.id, req.usuarioId);
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  return res.json({ producto });
});

const create = asyncHandler(async (req, res) => {
  const errores = validarProducto(req.body);
  if (errores.length) {
    return res.status(400).json({ errors: errores });
  }

  const id = await Producto.create(datosProductoDesdeBody(req.body), req.usuarioId);
  const producto = await Producto.findById(id, req.usuarioId);
  return res.status(201).json({ producto });
});

const update = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const producto = await Producto.findById(req.params.id, usuarioId);
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }

  const errores = validarProducto(req.body);
  if (errores.length) {
    return res.status(400).json({ errors: errores });
  }

  await Producto.update(req.params.id, datosProductoDesdeBody(req.body), usuarioId);
  const actualizado = await Producto.findById(req.params.id, usuarioId);
  return res.json({ producto: actualizado });
});

const toggle = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const producto = await Producto.findById(req.params.id, usuarioId);
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }

  await Producto.setActivo(req.params.id, !producto.activo, usuarioId);
  const actualizado = await Producto.findById(req.params.id, usuarioId);
  return res.json({ producto: actualizado });
});

module.exports = { index, show, create, update, toggle };
