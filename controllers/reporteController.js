const Venta = require('../models/Venta');
const Abono = require('../models/Abono');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');
const Reporte = require('../models/Reporte');
const { resolveDateRange } = require('../utils/dateRanges');

const TIPOS_VALIDOS = ['ventas', 'abonos', 'clientes', 'productos'];
const ESTADOS_VALIDOS = ['PAGADA', 'PENDIENTE', 'PARCIAL', 'ANULADA'];
const METODOS_PAGO_VALIDOS = ['EFECTIVO', 'TRANSFERENCIA', 'OTRO'];

function categorizarAntiguedad(dias) {
  if (dias === null || dias === undefined) return '—';
  if (dias <= 7) return '0–7 días';
  if (dias <= 30) return '8–30 días';
  return 'Más de 30 días';
}

async function index(req, res, next) {
  try {
    const usuarioId = req.session.usuario.id;
    const tipo = TIPOS_VALIDOS.includes(req.query.tipo) ? req.query.tipo : 'ventas';
    const rango = resolveDateRange(req.query);
    const clienteId = req.query.cliente_id ? parseInt(req.query.cliente_id, 10) : '';
    const productoId = req.query.producto_id ? parseInt(req.query.producto_id, 10) : '';
    const estado = ESTADOS_VALIDOS.includes(req.query.estado) ? req.query.estado : '';
    const metodoPago = METODOS_PAGO_VALIDOS.includes(req.query.metodo_pago) ? req.query.metodo_pago : '';

    const [clientes, productos] = await Promise.all([
      Cliente.findActivos(usuarioId),
      Producto.findActivos(usuarioId)
    ]);

    const filtros = { ...rango, clienteId, productoId, estado, metodoPago };

    let datos = {};

    if (tipo === 'ventas') {
      const [resumen, listado] = await Promise.all([
        Reporte.reporteVentas({
          usuarioId,
          fechaInicio: rango.fechaInicio,
          fechaFin: rango.fechaFin,
          clienteId,
          productoId,
          estado
        }),
        Venta.findAll({
          usuarioId,
          clienteId,
          estado,
          productoId,
          fechaInicio: rango.fechaInicio,
          fechaFin: rango.fechaFin,
          perPage: 20
        })
      ]);
      datos = { resumen, ventas: listado.ventas, totalCoincidencias: listado.total };
    } else if (tipo === 'abonos') {
      const [resumen, listado] = await Promise.all([
        Reporte.reporteAbonos({
          usuarioId,
          fechaInicio: rango.fechaInicio,
          fechaFin: rango.fechaFin,
          clienteId,
          metodoPago
        }),
        Abono.findAll({
          usuarioId,
          clienteId,
          metodoPago,
          fechaInicio: rango.fechaInicio,
          fechaFin: rango.fechaFin,
          perPage: 20
        })
      ]);
      datos = { resumen, abonos: listado.abonos, totalCoincidencias: listado.total };
    } else if (tipo === 'clientes') {
      const [resumenGlobal, mayorSaldo, deudaAntigua] = await Promise.all([
        Cliente.getResumenGlobal(usuarioId),
        Cliente.findMayorDeuda(usuarioId, 10),
        Cliente.findAntiguedadDeuda(usuarioId, 10)
      ]);
      datos = {
        resumen: {
          totalClientes: resumenGlobal.totalClientes,
          clientesConDeuda: resumenGlobal.clientesConDeuda,
          clientesSinDeuda: resumenGlobal.totalClientes - resumenGlobal.clientesConDeuda
        },
        mayorSaldo,
        deudaAntigua: deudaAntigua.map((cliente) => ({
          ...cliente,
          categoria: categorizarAntiguedad(cliente.dias_antiguedad)
        }))
      };
    } else if (tipo === 'productos') {
      const productosMasVendidos = await Producto.findMasVendidos({
        usuarioId,
        fechaInicio: rango.fechaInicio,
        fechaFin: rango.fechaFin,
        productoId,
        estado,
        limit: 50
      });
      datos = { productosMasVendidos };
    }

    res.render('reportes/index', {
      titulo: 'Reportes',
      activeNav: 'reportes',
      tipo,
      filtros,
      clientes,
      productos,
      datos,
      queryActual: req.query
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { index };
