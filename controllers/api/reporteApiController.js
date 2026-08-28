const Venta = require('../../models/Venta');
const Abono = require('../../models/Abono');
const Cliente = require('../../models/Cliente');
const Producto = require('../../models/Producto');
const Reporte = require('../../models/Reporte');
const { resolveDateRange } = require('../../utils/dateRanges');
const { construirWorkbook, construirWorkbookCompleto, nombreArchivo } = require('../../utils/reporteExcel');
const { asyncHandler } = require('./_helpers');

const ESTADOS_VALIDOS = ['PAGADA', 'PENDIENTE', 'PARCIAL', 'ANULADA'];
const METODOS_PAGO_VALIDOS = ['EFECTIVO', 'TRANSFERENCIA', 'OTRO'];

function categorizarAntiguedad(dias) {
  if (dias === null || dias === undefined) return '—';
  if (dias <= 7) return '0–7 días';
  if (dias <= 30) return '8–30 días';
  return 'Más de 30 días';
}

const ventas = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const rango = resolveDateRange(req.query);
  const clienteId = req.query.clienteId ? parseInt(req.query.clienteId, 10) : '';
  const productoId = req.query.productoId ? parseInt(req.query.productoId, 10) : '';
  const estado = ESTADOS_VALIDOS.includes(req.query.estado) ? req.query.estado : '';

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

  res.json({
    filtros: { ...rango, clienteId, productoId, estado },
    resumen,
    ventas: listado.ventas,
    totalCoincidencias: listado.total
  });
});

const abonos = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const rango = resolveDateRange(req.query);
  const clienteId = req.query.clienteId ? parseInt(req.query.clienteId, 10) : '';
  const metodoPago = METODOS_PAGO_VALIDOS.includes(req.query.metodoPago) ? req.query.metodoPago : '';

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

  res.json({
    filtros: { ...rango, clienteId, metodoPago },
    resumen,
    abonos: listado.abonos,
    totalCoincidencias: listado.total
  });
});

const clientes = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;

  const [resumenGlobal, mayorSaldo, deudaAntigua] = await Promise.all([
    Cliente.getResumenGlobal(usuarioId),
    Cliente.findMayorDeuda(usuarioId, 10),
    Cliente.findAntiguedadDeuda(usuarioId, 10)
  ]);

  res.json({
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
  });
});

const productos = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const rango = resolveDateRange(req.query);
  const productoId = req.query.productoId ? parseInt(req.query.productoId, 10) : '';
  const estado = ESTADOS_VALIDOS.includes(req.query.estado) ? req.query.estado : '';

  const productosMasVendidos = await Producto.findMasVendidos({
    usuarioId,
    fechaInicio: rango.fechaInicio,
    fechaFin: rango.fechaFin,
    productoId,
    estado,
    limit: 50
  });

  res.json({
    filtros: { ...rango, productoId, estado },
    productosMasVendidos
  });
});

function crearExportador(tipo) {
  return asyncHandler(async (req, res) => {
    const usuarioId = req.usuarioId;
    const rango = resolveDateRange(req.query);
    const clienteId = req.query.clienteId ? parseInt(req.query.clienteId, 10) : '';
    const productoId = req.query.productoId ? parseInt(req.query.productoId, 10) : '';
    const estado = ESTADOS_VALIDOS.includes(req.query.estado) ? req.query.estado : '';
    const metodoPago = METODOS_PAGO_VALIDOS.includes(req.query.metodoPago) ? req.query.metodoPago : '';

    const workbook = await construirWorkbook({
      tipo,
      usuarioId,
      filtros: { fechaInicio: rango.fechaInicio, fechaFin: rango.fechaFin, clienteId, productoId, estado, metodoPago }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo(tipo)}"`);
    await workbook.xlsx.write(res);
    res.end();
  });
}

const exportarVentas = crearExportador('ventas');
const exportarAbonos = crearExportador('abonos');
const exportarClientes = crearExportador('clientes');
const exportarProductos = crearExportador('productos');

const exportarTodo = asyncHandler(async (req, res) => {
  const usuarioId = req.usuarioId;
  const rango = resolveDateRange(req.query);
  const clienteId = req.query.clienteId ? parseInt(req.query.clienteId, 10) : '';
  const productoId = req.query.productoId ? parseInt(req.query.productoId, 10) : '';
  const estado = ESTADOS_VALIDOS.includes(req.query.estado) ? req.query.estado : '';
  const metodoPago = METODOS_PAGO_VALIDOS.includes(req.query.metodoPago) ? req.query.metodoPago : '';

  const workbook = await construirWorkbookCompleto({
    usuarioId,
    filtros: { fechaInicio: rango.fechaInicio, fechaFin: rango.fechaFin, clienteId, productoId, estado, metodoPago }
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('todo')}"`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  ventas,
  abonos,
  clientes,
  productos,
  exportarVentas,
  exportarAbonos,
  exportarClientes,
  exportarProductos,
  exportarTodo
};
