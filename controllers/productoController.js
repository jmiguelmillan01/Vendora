const Producto = require('../models/Producto');
const { buildQueryString } = require('../utils/query');

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

async function index(req, res, next) {
  try {
    const filtros = parseFiltros(req.query);
    const { productos, total } = await Producto.findAll({ ...filtros, perPage: PER_PAGE });
    const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));

    res.render('productos/index', {
      titulo: 'Productos',
      activeNav: 'productos',
      productos,
      filtros,
      queryString: buildQueryString(req.query),
      paginacion: { paginaActual: filtros.page, totalPaginas, total, entidad: 'productos' }
    });
  } catch (error) {
    next(error);
  }
}

function showCreateForm(req, res) {
  res.render('productos/form', {
    titulo: 'Nuevo producto/servicio',
    activeNav: 'productos',
    producto: {},
    errores: [],
    esEdicion: false
  });
}

async function create(req, res, next) {
  try {
    const errores = validarProducto(req.body);

    if (errores.length) {
      return res.status(400).render('productos/form', {
        titulo: 'Nuevo producto/servicio',
        activeNav: 'productos',
        producto: req.body,
        errores,
        esEdicion: false
      });
    }

    await Producto.create(datosProductoDesdeBody(req.body));

    req.session.flash = { type: 'success', message: 'Producto/servicio creado correctamente.' };
    res.redirect('/productos');
  } catch (error) {
    next(error);
  }
}

async function showEditForm(req, res, next) {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).render('404', { titulo: 'Producto no encontrado' });
    }

    res.render('productos/form', {
      titulo: 'Editar producto/servicio',
      activeNav: 'productos',
      producto,
      errores: [],
      esEdicion: true
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).render('404', { titulo: 'Producto no encontrado' });
    }

    const errores = validarProducto(req.body);

    if (errores.length) {
      return res.status(400).render('productos/form', {
        titulo: 'Editar producto/servicio',
        activeNav: 'productos',
        producto: { ...producto, ...req.body },
        errores,
        esEdicion: true
      });
    }

    await Producto.update(req.params.id, datosProductoDesdeBody(req.body));

    req.session.flash = { type: 'success', message: 'Producto/servicio actualizado correctamente.' };
    res.redirect('/productos');
  } catch (error) {
    next(error);
  }
}

async function toggleActivo(req, res, next) {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).render('404', { titulo: 'Producto no encontrado' });
    }

    await Producto.setActivo(req.params.id, !producto.activo);

    req.session.flash = {
      type: 'success',
      message: producto.activo ? 'Producto/servicio desactivado.' : 'Producto/servicio activado.'
    };
    res.redirect('/productos');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  index,
  showCreateForm,
  create,
  showEditForm,
  update,
  toggleActivo
};
