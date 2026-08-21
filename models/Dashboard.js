const pool = require('../config/database');

async function getIndicadoresVentasAbonos(usuarioId) {
  const [[fila]] = await pool.query(
    `SELECT
        COALESCE((SELECT SUM(total) FROM ventas WHERE usuario_id = ? AND DATE(fecha) = CURDATE() AND estado != 'ANULADA'), 0) AS ventas_hoy,
        COALESCE((SELECT SUM(total) FROM ventas WHERE usuario_id = ? AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE()) AND estado != 'ANULADA'), 0) AS ventas_mes,
        COALESCE((SELECT SUM(total) FROM ventas WHERE usuario_id = ? AND tipo_pago IN ('CREDITO', 'PARCIAL') AND estado != 'ANULADA' AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())), 0) AS ventas_credito_mes,
        COALESCE((SELECT SUM(valor) FROM abonos WHERE usuario_id = ? AND anulado = 0 AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())), 0) AS abonos_mes`,
    [usuarioId, usuarioId, usuarioId, usuarioId]
  );

  return {
    ventasHoy: Number(fila.ventas_hoy),
    ventasMes: Number(fila.ventas_mes),
    ventasCreditoMes: Number(fila.ventas_credito_mes),
    abonosMes: Number(fila.abonos_mes)
  };
}

async function getVentasRecientes(usuarioId, limit = 5) {
  const [rows] = await pool.query(
    `SELECT v.id, v.fecha, v.total, v.estado, v.tipo_pago, c.nombre AS cliente_nombre
     FROM ventas v
     JOIN clientes c ON c.id = v.cliente_id
     WHERE v.usuario_id = ?
     ORDER BY v.fecha DESC, v.id DESC
     LIMIT ?`,
    [usuarioId, Number(limit)]
  );
  return rows;
}

async function getAbonosRecientes(usuarioId, limit = 5) {
  const [rows] = await pool.query(
    `SELECT a.id, a.fecha, a.valor, a.metodo_pago, a.anulado, c.nombre AS cliente_nombre
     FROM abonos a
     JOIN clientes c ON c.id = a.cliente_id
     WHERE a.usuario_id = ?
     ORDER BY a.fecha DESC, a.id DESC
     LIMIT ?`,
    [usuarioId, Number(limit)]
  );
  return rows;
}

async function getVentasPorDia({ usuarioId, fechaInicio, fechaFin }) {
  const [rows] = await pool.query(
    `SELECT DATE(fecha) AS periodo, SUM(total) AS total
     FROM ventas
     WHERE usuario_id = ? AND estado != 'ANULADA' AND fecha >= ? AND fecha <= ?
     GROUP BY DATE(fecha)
     ORDER BY periodo ASC`,
    [usuarioId, fechaInicio, `${fechaFin} 23:59:59`]
  );
  return rows;
}

async function getVentasPorMes(usuarioId, mesesAtras = 6) {
  const [rows] = await pool.query(
    `SELECT DATE_FORMAT(fecha, '%Y-%m') AS periodo, SUM(total) AS total
     FROM ventas
     WHERE usuario_id = ? AND estado != 'ANULADA'
       AND fecha >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ? MONTH)
     GROUP BY DATE_FORMAT(fecha, '%Y-%m')
     ORDER BY periodo ASC`,
    [usuarioId, mesesAtras - 1]
  );
  return rows;
}

async function getCreditosPorPeriodo({ usuarioId, fechaInicio, fechaFin }) {
  const [rows] = await pool.query(
    `SELECT DATE(fecha) AS periodo, SUM(total) AS total
     FROM ventas
     WHERE usuario_id = ? AND tipo_pago IN ('CREDITO', 'PARCIAL') AND estado != 'ANULADA'
       AND fecha >= ? AND fecha <= ?
     GROUP BY DATE(fecha)
     ORDER BY periodo ASC`,
    [usuarioId, fechaInicio, `${fechaFin} 23:59:59`]
  );
  return rows;
}

async function getAbonosPorPeriodo({ usuarioId, fechaInicio, fechaFin }) {
  const [rows] = await pool.query(
    `SELECT DATE(fecha) AS periodo, SUM(valor) AS total
     FROM abonos
     WHERE usuario_id = ? AND anulado = 0 AND fecha >= ? AND fecha <= ?
     GROUP BY DATE(fecha)
     ORDER BY periodo ASC`,
    [usuarioId, fechaInicio, `${fechaFin} 23:59:59`]
  );
  return rows;
}

module.exports = {
  getIndicadoresVentasAbonos,
  getVentasRecientes,
  getAbonosRecientes,
  getVentasPorDia,
  getVentasPorMes,
  getCreditosPorPeriodo,
  getAbonosPorPeriodo
};
