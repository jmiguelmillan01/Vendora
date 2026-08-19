const Cliente = require('../models/Cliente');
const { buildQueryString } = require('../utils/query');

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

async function index(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const filtros = parseFiltros(req.query);
    const { clientes, total } = await Cliente.findAll({ ...filtros, usuarioId, perPage: PER_PAGE });
    const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE));

    res.render('clientes/index', {
      titulo: 'Clientes',
      activeNav: 'clientes',
      clientes,
      filtros,
      queryString: buildQueryString(req.query),
      paginacion: { paginaActual: filtros.page, totalPaginas, total, entidad: 'clientes' }
    });
  } catch (error) {
    next(error);
  }
}

function showCreateForm(req, res) {
  res.render('clientes/form', {
    titulo: 'Nuevo cliente',
    activeNav: 'clientes',
    cliente: {},
    errores: [],
    esEdicion: false
  });
}

async function create(req, res, next) {
  try {
    const errores = validarCliente(req.body);

    if (errores.length) {
      return res.status(400).render('clientes/form', {
        titulo: 'Nuevo cliente',
        activeNav: 'clientes',
        cliente: req.body,
        errores,
        esEdicion: false
      });
    }

    await Cliente.create(datosClienteDesdeBody(req.body), req.session.usuario.id);

    req.session.flash = { type: 'success', message: 'Cliente creado correctamente.' };
    res.redirect('/clientes');
  } catch (error) {
    next(error);
  }
}

async function showEditForm(req, res, next) {
  try {
    const cliente = await Cliente.findById(req.params.id, req.session.usuario.id);
    if (!cliente) {
      return res.status(404).render('404', { titulo: 'Cliente no encontrado' });
    }

    res.render('clientes/form', {
      titulo: 'Editar cliente',
      activeNav: 'clientes',
      cliente,
      errores: [],
      esEdicion: true
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const cliente = await Cliente.findById(req.params.id, usuarioId);
    if (!cliente) {
      return res.status(404).render('404', { titulo: 'Cliente no encontrado' });
    }

    const errores = validarCliente(req.body);

    if (errores.length) {
      return res.status(400).render('clientes/form', {
        titulo: 'Editar cliente',
        activeNav: 'clientes',
        cliente: { ...cliente, ...req.body },
        errores,
        esEdicion: true
      });
    }

    await Cliente.update(req.params.id, datosClienteDesdeBody(req.body), usuarioId);

    req.session.flash = { type: 'success', message: 'Cliente actualizado correctamente.' };
    res.redirect(`/clientes/${req.params.id}`);
  } catch (error) {
    next(error);
  }
}

async function toggleActivo(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const cliente = await Cliente.findById(req.params.id, usuarioId);
    if (!cliente) {
      return res.status(404).render('404', { titulo: 'Cliente no encontrado' });
    }

    await Cliente.setActivo(req.params.id, !cliente.activo, usuarioId);

    req.session.flash = {
      type: 'success',
      message: cliente.activo ? 'Cliente desactivado.' : 'Cliente activado.'
    };
    res.redirect('/clientes');
  } catch (error) {
    next(error);
  }
}

async function show(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const cliente = await Cliente.findById(req.params.id, usuarioId);
    if (!cliente) {
      return res.status(404).render('404', { titulo: 'Cliente no encontrado' });
    }

    const fechaInicio = (req.query.fechaInicio || '').trim();
    const fechaFin = (req.query.fechaFin || '').trim();

    const [resumen, historial] = await Promise.all([
      Cliente.getResumenFinanciero(req.params.id, usuarioId),
      Cliente.getHistorial(req.params.id, usuarioId, { fechaInicio, fechaFin })
    ]);

    res.render('clientes/show', {
      titulo: cliente.nombre,
      activeNav: 'clientes',
      cliente,
      resumen,
      historial,
      filtros: { fechaInicio, fechaFin }
    });
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
  toggleActivo,
  show
};
