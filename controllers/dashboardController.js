const Dashboard = require('../models/Dashboard');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');

function primerDiaMesISO() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

async function index(req, res, next) {
  try {
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
      Dashboard.getIndicadoresVentasAbonos(),
      Cliente.getResumenGlobal(),
      Dashboard.getVentasRecientes(5),
      Dashboard.getAbonosRecientes(5),
      Cliente.findMayorDeuda(5),
      Dashboard.getVentasPorDia({ fechaInicio, fechaFin }),
      Dashboard.getVentasPorMes(6),
      Dashboard.getCreditosPorPeriodo({ fechaInicio, fechaFin }),
      Dashboard.getAbonosPorPeriodo({ fechaInicio, fechaFin }),
      Producto.findMasVendidos({ fechaInicio, fechaFin, limit: 5 })
    ]);

    res.render('dashboard/index', {
      titulo: 'Dashboard',
      activeNav: 'dashboard',
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
  } catch (error) {
    next(error);
  }
}

module.exports = { index };
