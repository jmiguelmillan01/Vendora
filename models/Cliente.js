const pool = require('../config/database');

const COLUMNAS_ORDEN = {
  nombre: 'c.nombre',
  reciente: 'c.created_at',
  saldo: 'saldo'
};

const SALDO_JOIN = `
  LEFT JOIN (
    SELECT cliente_id, SUM(total) AS total_credito
    FROM ventas
    WHERE tipo_pago IN ('CREDITO', 'PARCIAL') AND estado != 'ANULADA'
    GROUP BY cliente_id
  ) v ON v.cliente_id = c.id
  LEFT JOIN (
    SELECT cliente_id, SUM(valor) AS total_abonado
    FROM abonos
    GROUP BY cliente_id
  ) a ON a.cliente_id = c.id
`;
const SALDO_EXPR = 'COALESCE(v.total_credito, 0) - COALESCE(a.total_abonado, 0) AS saldo';

async function findAll({
  search = '',
  activo = '',
  page = 1,
  perPage = 10,
  orderBy = 'nombre',
  orderDir = 'ASC'
} = {}) {
  const condiciones = [];
  const params = [];

  if (search) {
    condiciones.push('(c.nombre LIKE ? OR c.telefono LIKE ? OR c.email LIKE ? OR c.documento LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  if (activo === '1' || activo === '0') {
    condiciones.push('c.activo = ?');
    params.push(activo);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const columnaOrden = COLUMNAS_ORDEN[orderBy] || COLUMNAS_ORDEN.nombre;
  const direccion = orderDir === 'DESC' ? 'DESC' : 'ASC';
  const paginaActual = Math.max(1, page);
  const offset = (paginaActual - 1) * perPage;

  const [rows] = await pool.query(
    `SELECT c.*, ${SALDO_EXPR}
     FROM clientes c
     ${SALDO_JOIN}
     ${where}
     ORDER BY ${columnaOrden} ${direccion}
     LIMIT ? OFFSET ?`,
    [...params, Number(perPage), Number(offset)]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM clientes c ${where}`,
    params
  );

  return { clientes: rows, total };
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM clientes WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function findActivos() {
  const [rows] = await pool.query(
    'SELECT id, nombre, telefono FROM clientes WHERE activo = 1 ORDER BY nombre ASC'
  );
  return rows;
}

async function findActivosConSaldo() {
  const [rows] = await pool.query(
    `SELECT c.id, c.nombre, c.telefono, ${SALDO_EXPR}
     FROM clientes c
     ${SALDO_JOIN}
     WHERE c.activo = 1
     ORDER BY c.nombre ASC`
  );
  return rows;
}

async function create(datos) {
  const { nombre, telefono, email, direccion, documento, observaciones } = datos;
  const [resultado] = await pool.query(
    `INSERT INTO clientes (nombre, telefono, email, direccion, documento, observaciones)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, telefono || null, email || null, direccion || null, documento || null, observaciones || null]
  );
  return resultado.insertId;
}

async function update(id, datos) {
  const { nombre, telefono, email, direccion, documento, observaciones } = datos;
  await pool.query(
    `UPDATE clientes
     SET nombre = ?, telefono = ?, email = ?, direccion = ?, documento = ?, observaciones = ?
     WHERE id = ?`,
    [nombre, telefono || null, email || null, direccion || null, documento || null, observaciones || null, id]
  );
}

async function setActivo(id, activo) {
  await pool.query('UPDATE clientes SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
}

async function getResumenFinanciero(clienteId) {
  const [[resumen]] = await pool.query(
    `SELECT
        COALESCE((SELECT SUM(total) FROM ventas WHERE cliente_id = ? AND tipo_pago IN ('CREDITO', 'PARCIAL') AND estado != 'ANULADA'), 0) AS total_credito,
        COALESCE((SELECT SUM(valor) FROM abonos WHERE cliente_id = ?), 0) AS total_abonado,
        (SELECT MAX(fecha) FROM ventas WHERE cliente_id = ? AND estado != 'ANULADA') AS fecha_ultima_compra,
        (SELECT MAX(fecha) FROM abonos WHERE cliente_id = ?) AS fecha_ultimo_abono`,
    [clienteId, clienteId, clienteId, clienteId]
  );

  const totalCredito = Number(resumen.total_credito);
  const totalAbonado = Number(resumen.total_abonado);

  return {
    totalCredito,
    totalAbonado,
    saldo: totalCredito - totalAbonado,
    fechaUltimaCompra: resumen.fecha_ultima_compra,
    fechaUltimoAbono: resumen.fecha_ultimo_abono
  };
}

async function getResumenGlobal() {
  const [[fila]] = await pool.query(
    `SELECT
        COALESCE(SUM(GREATEST(saldo, 0)), 0) AS total_pendiente,
        COUNT(CASE WHEN saldo > 0 THEN 1 END) AS clientes_con_deuda,
        COUNT(*) AS total_clientes
     FROM (
       SELECT ${SALDO_EXPR}
       FROM clientes c
       ${SALDO_JOIN}
       WHERE c.activo = 1
     ) saldos`
  );

  return {
    totalPendiente: Number(fila.total_pendiente),
    clientesConDeuda: Number(fila.clientes_con_deuda),
    totalClientes: Number(fila.total_clientes)
  };
}

async function findMayorDeuda(limit = 5) {
  const [rows] = await pool.query(
    `SELECT c.id, c.nombre, ${SALDO_EXPR}
     FROM clientes c
     ${SALDO_JOIN}
     WHERE c.activo = 1
     HAVING saldo > 0
     ORDER BY saldo DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

async function findAntiguedadDeuda(limit = 10) {
  const [rows] = await pool.query(
    `SELECT c.id, c.nombre, ${SALDO_EXPR},
        DATEDIFF(CURDATE(), (
          SELECT MIN(fecha) FROM ventas
          WHERE cliente_id = c.id AND tipo_pago IN ('CREDITO', 'PARCIAL') AND estado != 'ANULADA'
        )) AS dias_antiguedad
     FROM clientes c
     ${SALDO_JOIN}
     WHERE c.activo = 1
     HAVING saldo > 0
     ORDER BY dias_antiguedad DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

async function getHistorial(clienteId, { fechaInicio = '', fechaFin = '' } = {}) {
  const condicionesVenta = ['cliente_id = ?', "estado != 'ANULADA'"];
  const condicionesAbono = ['cliente_id = ?'];
  const paramsVenta = [clienteId];
  const paramsAbono = [clienteId];

  if (fechaInicio) {
    condicionesVenta.push('fecha >= ?');
    condicionesAbono.push('fecha >= ?');
    paramsVenta.push(fechaInicio);
    paramsAbono.push(fechaInicio);
  }

  if (fechaFin) {
    condicionesVenta.push('fecha <= ?');
    condicionesAbono.push('fecha <= ?');
    paramsVenta.push(`${fechaFin} 23:59:59`);
    paramsAbono.push(`${fechaFin} 23:59:59`);
  }

  const [rows] = await pool.query(
    `SELECT id, fecha, 'VENTA' AS tipo, CONCAT('Venta #', id) AS descripcion, total AS valor, estado
     FROM ventas
     WHERE ${condicionesVenta.join(' AND ')}
     UNION ALL
     SELECT id, fecha, 'ABONO' AS tipo, CONCAT('Abono - ', metodo_pago) AS descripcion, -valor AS valor, NULL AS estado
     FROM abonos
     WHERE ${condicionesAbono.join(' AND ')}
     ORDER BY fecha DESC, id DESC`,
    [...paramsVenta, ...paramsAbono]
  );

  return rows;
}

module.exports = {
  findAll,
  findById,
  findActivos,
  findActivosConSaldo,
  create,
  update,
  setActivo,
  getResumenFinanciero,
  getResumenGlobal,
  findMayorDeuda,
  findAntiguedadDeuda,
  getHistorial
};
