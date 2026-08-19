const pool = require('../config/database');
const Venta = require('./Venta');

async function reporteVentas({ usuarioId, fechaInicio, fechaFin, clienteId = '', productoId = '', estado = '' }) {
  const condiciones = ['v.usuario_id = ?', 'v.fecha >= ?', 'v.fecha <= ?'];
  const params = [usuarioId, fechaInicio, `${fechaFin} 23:59:59`];

  if (estado) {
    condiciones.push('v.estado = ?');
    params.push(estado);
  } else {
    condiciones.push("v.estado != 'ANULADA'");
  }

  if (clienteId) {
    condiciones.push('v.cliente_id = ?');
    params.push(clienteId);
  }

  if (productoId) {
    condiciones.push('v.id IN (SELECT venta_id FROM detalle_venta WHERE producto_id = ?)');
    params.push(productoId);
  }

  const where = `WHERE ${condiciones.join(' AND ')}`;

  const [ventasFiltradas] = await pool.query(
    `SELECT v.id, v.cliente_id, v.total, v.estado, v.tipo_pago
     FROM ventas v
     ${where}`,
    params
  );

  const cantidadVentas = ventasFiltradas.length;
  const totalVendido = ventasFiltradas.reduce((acumulado, v) => acumulado + Number(v.total), 0);
  const totalPagado = ventasFiltradas
    .filter((v) => v.estado === 'PAGADA')
    .reduce((acumulado, v) => acumulado + Number(v.total), 0);

  const ventasCredito = ventasFiltradas.filter((v) => v.tipo_pago === 'CREDITO' || v.tipo_pago === 'PARCIAL');
  const totalCredito = ventasCredito.reduce((acumulado, v) => acumulado + Number(v.total), 0);

  // El total pendiente real de cada venta a crédito/parcial depende de cómo
  // se distribuyeron los abonos del cliente (FIFO, ver Venta.js) y no de si
  // esa venta en particular quedó marcada como PARCIAL: sumar su total
  // completo ignoraría lo que el cliente ya abonó. Se reutiliza la misma
  // distribución que determina el estado de cada venta para conocer el
  // monto que sigue pendiente de cada una.
  const clientesConCredito = [...new Set(ventasCredito.map((v) => v.cliente_id))];
  const saldosPorVenta = new Map();

  for (const idCliente of clientesConCredito) {
    const saldos = await Venta.obtenerSaldosCliente(idCliente, usuarioId);
    saldos.forEach((saldo) => saldosPorVenta.set(saldo.id, saldo.montoPendiente));
  }

  const totalPendiente = ventasCredito.reduce(
    (acumulado, v) => acumulado + (saldosPorVenta.get(v.id) || 0),
    0
  );

  return {
    cantidadVentas,
    totalVendido,
    totalPagado,
    totalCredito,
    totalPendiente
  };
}

async function reporteAbonos({ usuarioId, fechaInicio, fechaFin, clienteId = '', metodoPago = '' }) {
  const condiciones = ['usuario_id = ?', 'fecha >= ?', 'fecha <= ?'];
  const params = [usuarioId, fechaInicio, `${fechaFin} 23:59:59`];

  if (clienteId) {
    condiciones.push('cliente_id = ?');
    params.push(clienteId);
  }

  if (metodoPago) {
    condiciones.push('metodo_pago = ?');
    params.push(metodoPago);
  }

  const where = `WHERE ${condiciones.join(' AND ')}`;

  const [[resumen]] = await pool.query(
    `SELECT COUNT(*) AS cantidad_abonos, COALESCE(SUM(valor), 0) AS total_recibido
     FROM abonos
     ${where}`,
    params
  );

  const [porMetodo] = await pool.query(
    `SELECT metodo_pago, COUNT(*) AS cantidad, COALESCE(SUM(valor), 0) AS total
     FROM abonos
     ${where}
     GROUP BY metodo_pago
     ORDER BY total DESC`,
    params
  );

  const [porDia] = await pool.query(
    `SELECT DATE(fecha) AS dia, COUNT(*) AS cantidad, COALESCE(SUM(valor), 0) AS total
     FROM abonos
     ${where}
     GROUP BY DATE(fecha)
     ORDER BY dia ASC`,
    params
  );

  return {
    cantidadAbonos: Number(resumen.cantidad_abonos),
    totalRecibido: Number(resumen.total_recibido),
    porMetodo,
    porDia
  };
}

module.exports = {
  reporteVentas,
  reporteAbonos
};
