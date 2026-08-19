const pool = require('../config/database');

const COLUMNAS_ORDEN = {
  nombre: 'nombre',
  reciente: 'created_at',
  precio: 'precio'
};

async function findAll({
  usuarioId,
  search = '',
  tipo = '',
  activo = '',
  page = 1,
  perPage = 10,
  orderBy = 'nombre',
  orderDir = 'ASC'
} = {}) {
  const condiciones = ['usuario_id = ?'];
  const params = [usuarioId];

  if (search) {
    condiciones.push('(nombre LIKE ? OR descripcion LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like);
  }

  if (tipo === 'producto' || tipo === 'servicio') {
    condiciones.push('tipo = ?');
    params.push(tipo);
  }

  if (activo === '1' || activo === '0') {
    condiciones.push('activo = ?');
    params.push(activo);
  }

  const where = `WHERE ${condiciones.join(' AND ')}`;
  const columnaOrden = COLUMNAS_ORDEN[orderBy] || COLUMNAS_ORDEN.nombre;
  const direccion = orderDir === 'DESC' ? 'DESC' : 'ASC';
  const paginaActual = Math.max(1, page);
  const offset = (paginaActual - 1) * perPage;

  const [rows] = await pool.query(
    `SELECT * FROM productos
     ${where}
     ORDER BY ${columnaOrden} ${direccion}
     LIMIT ? OFFSET ?`,
    [...params, Number(perPage), Number(offset)]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM productos ${where}`,
    params
  );

  return { productos: rows, total };
}

async function findById(id, usuarioId) {
  const [rows] = await pool.query(
    'SELECT * FROM productos WHERE id = ? AND usuario_id = ? LIMIT 1',
    [id, usuarioId]
  );
  return rows[0] || null;
}

async function findActivos(usuarioId) {
  const [rows] = await pool.query(
    'SELECT id, nombre, tipo, precio FROM productos WHERE usuario_id = ? AND activo = 1 ORDER BY nombre ASC',
    [usuarioId]
  );
  return rows;
}

async function findMasVendidos({
  usuarioId,
  fechaInicio = '',
  fechaFin = '',
  productoId = '',
  estado = '',
  limit = 5
} = {}) {
  const condiciones = ['v.usuario_id = ?'];
  const params = [usuarioId];

  if (estado) {
    condiciones.push('v.estado = ?');
    params.push(estado);
  } else {
    condiciones.push("v.estado != 'ANULADA'");
  }

  if (fechaInicio) {
    condiciones.push('v.fecha >= ?');
    params.push(fechaInicio);
  }

  if (fechaFin) {
    condiciones.push('v.fecha <= ?');
    params.push(`${fechaFin} 23:59:59`);
  }

  if (productoId) {
    condiciones.push('p.id = ?');
    params.push(productoId);
  }

  const [rows] = await pool.query(
    `SELECT p.id, p.nombre, p.tipo,
        SUM(d.cantidad) AS cantidad_vendida,
        SUM(d.subtotal) AS total_generado
     FROM detalle_venta d
     JOIN ventas v ON v.id = d.venta_id
     JOIN productos p ON p.id = d.producto_id
     WHERE ${condiciones.join(' AND ')}
     GROUP BY p.id, p.nombre, p.tipo
     ORDER BY cantidad_vendida DESC
     LIMIT ?`,
    [...params, Number(limit)]
  );
  return rows;
}

async function create(datos, usuarioId) {
  const { nombre, descripcion, tipo, precio } = datos;
  const [resultado] = await pool.query(
    `INSERT INTO productos (usuario_id, nombre, descripcion, tipo, precio)
     VALUES (?, ?, ?, ?, ?)`,
    [usuarioId, nombre, descripcion || null, tipo, precio]
  );
  return resultado.insertId;
}

async function update(id, datos, usuarioId) {
  const { nombre, descripcion, tipo, precio } = datos;
  await pool.query(
    `UPDATE productos
     SET nombre = ?, descripcion = ?, tipo = ?, precio = ?
     WHERE id = ? AND usuario_id = ?`,
    [nombre, descripcion || null, tipo, precio, id, usuarioId]
  );
}

async function setActivo(id, activo, usuarioId) {
  await pool.query(
    'UPDATE productos SET activo = ? WHERE id = ? AND usuario_id = ?',
    [activo ? 1 : 0, id, usuarioId]
  );
}

module.exports = {
  findAll,
  findById,
  findActivos,
  findMasVendidos,
  create,
  update,
  setActivo
};
