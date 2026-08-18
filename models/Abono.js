const pool = require('../config/database');
const Venta = require('./Venta');

async function create({ clienteId, valor, metodoPago, observacion = null }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [resultado] = await connection.query(
      `INSERT INTO abonos (cliente_id, valor, metodo_pago, observacion)
       VALUES (?, ?, ?, ?)`,
      [clienteId, valor, metodoPago, observacion]
    );

    // El abono reduce la deuda del cliente, así que las ventas a crédito
    // afectadas deben quedar reflejadas como pagadas/parciales de inmediato.
    await Venta.reconciliarEstadosCliente(connection, clienteId);

    await connection.commit();
    return resultado.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findAll({
  clienteId = '',
  metodoPago = '',
  fechaInicio = '',
  fechaFin = '',
  page = 1,
  perPage = 10
} = {}) {
  const condiciones = [];
  const params = [];

  if (clienteId) {
    condiciones.push('a.cliente_id = ?');
    params.push(clienteId);
  }

  if (metodoPago) {
    condiciones.push('a.metodo_pago = ?');
    params.push(metodoPago);
  }

  if (fechaInicio) {
    condiciones.push('a.fecha >= ?');
    params.push(fechaInicio);
  }

  if (fechaFin) {
    condiciones.push('a.fecha <= ?');
    params.push(`${fechaFin} 23:59:59`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const paginaActual = Math.max(1, page);
  const offset = (paginaActual - 1) * perPage;

  const [rows] = await pool.query(
    `SELECT a.*, c.nombre AS cliente_nombre
     FROM abonos a
     JOIN clientes c ON c.id = a.cliente_id
     ${where}
     ORDER BY a.fecha DESC, a.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(perPage), Number(offset)]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM abonos a ${where}`,
    params
  );

  return { abonos: rows, total };
}

module.exports = {
  create,
  findAll
};
