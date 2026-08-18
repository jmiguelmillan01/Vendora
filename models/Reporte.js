const pool = require('../config/database');

async function reporteVentas({ fechaInicio, fechaFin, clienteId = '', productoId = '', estado = '' }) {
  const condiciones = ['v.fecha >= ?', 'v.fecha <= ?'];
  const params = [fechaInicio, `${fechaFin} 23:59:59`];

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

  const [[fila]] = await pool.query(
    `SELECT
        COUNT(*) AS cantidad_ventas,
        COALESCE(SUM(total), 0) AS total_vendido,
        COALESCE(SUM(CASE WHEN estado = 'PAGADA' THEN total ELSE 0 END), 0) AS total_pagado,
        COALESCE(SUM(CASE WHEN tipo_pago IN ('CREDITO', 'PARCIAL') THEN total ELSE 0 END), 0) AS total_credito,
        COALESCE(SUM(CASE WHEN estado IN ('PENDIENTE', 'PARCIAL') THEN total ELSE 0 END), 0) AS total_pendiente
     FROM ventas v
     ${where}`,
    params
  );

  return {
    cantidadVentas: Number(fila.cantidad_ventas),
    totalVendido: Number(fila.total_vendido),
    totalPagado: Number(fila.total_pagado),
    totalCredito: Number(fila.total_credito),
    totalPendiente: Number(fila.total_pendiente)
  };
}

async function reporteAbonos({ fechaInicio, fechaFin, clienteId = '', metodoPago = '' }) {
  const condiciones = ['fecha >= ?', 'fecha <= ?'];
  const params = [fechaInicio, `${fechaFin} 23:59:59`];

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
