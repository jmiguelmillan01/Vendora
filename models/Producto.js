const pool = require('../config/database');

const COLUMNAS_ORDEN = {
  nombre: 'nombre',
  reciente: 'created_at',
  precio: 'precio'
};

async function findAll({
  search = '',
  tipo = '',
  activo = '',
  page = 1,
  perPage = 10,
  orderBy = 'nombre',
  orderDir = 'ASC'
} = {}) {
  const condiciones = [];
  const params = [];

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

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
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

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM productos WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findActivos() {
  const [rows] = await pool.query(
    'SELECT id, nombre, tipo, precio FROM productos WHERE activo = 1 ORDER BY nombre ASC'
  );
  return rows;
}

async function create(datos) {
  const { nombre, descripcion, tipo, precio } = datos;
  const [resultado] = await pool.query(
    `INSERT INTO productos (nombre, descripcion, tipo, precio)
     VALUES (?, ?, ?, ?)`,
    [nombre, descripcion || null, tipo, precio]
  );
  return resultado.insertId;
}

async function update(id, datos) {
  const { nombre, descripcion, tipo, precio } = datos;
  await pool.query(
    `UPDATE productos
     SET nombre = ?, descripcion = ?, tipo = ?, precio = ?
     WHERE id = ?`,
    [nombre, descripcion || null, tipo, precio, id]
  );
}

async function setActivo(id, activo) {
  await pool.query('UPDATE productos SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
}

module.exports = {
  findAll,
  findById,
  findActivos,
  create,
  update,
  setActivo
};
