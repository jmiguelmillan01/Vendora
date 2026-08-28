const Dashboard = require('../../models/Dashboard');
const Cliente = require('../../models/Cliente');
const Producto = require('../../models/Producto');
const { asyncHandler } = require('./_helpers');

function primerDiaMesISO() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const index = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const fechaInicio = (req.query.fechaInicio || '').trim() || primerDiaMesISO();
  const fechaFin = (req.query.fechaFin || '').trim() || hoyISO();

  const [
    indicadoresVentasAbonos,
    resumenGlobal,
    ventasRecientes,
    abonosRecientes,
    clientesMayorDeuda,
    ventasPorDia,
    ventasPorMes,
    creditosPorPeriodo,
    abonosPorPeriodo,
    productosMasVendidos
  ] = await Promise.all([
    Dashboard.getIndicadoresVentasAbonos(usuarioId),
    Cliente.getResumenGlobal(usuarioId),
    Dashboard.getVentasRecientes(usuarioId, 5),
    Dashboard.getAbonosRecientes(usuarioId, 5),
    Cliente.findMayorDeuda(usuarioId, 5),
    Dashboard.getVentasPorDia({ usuarioId, fechaInicio, fechaFin }),
    Dashboard.getVentasPorMes(usuarioId, 6),
    Dashboard.getCreditosPorPeriodo({ usuarioId, fechaInicio, fechaFin }),
    Dashboard.getAbonosPorPeriodo({ usuarioId, fechaInicio, fechaFin }),
    Producto.findMasVendidos({ usuarioId, fechaInicio, fechaFin, limit: 5 })
  ]);

  res.json({
    indicadores: { ...indicadoresVentasAbonos, ...resumenGlobal },
    ventasRecientes,
    abonosRecientes,
    clientesMayorDeuda,
    filtros: { fechaInicio, fechaFin },
    graficos: {
      ventasPorDia,
      ventasPorMes,
      creditosPorPeriodo,
      abonosPorPeriodo,
      productosMasVendidos
    }
  });
});

module.exports = { index };
