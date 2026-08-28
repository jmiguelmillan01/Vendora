const ExcelJS = require('exceljs');
const Venta = require('../models/Venta');
const Abono = require('../models/Abono');
const Cliente = require('../models/Cliente');
const Producto = require('../models/Producto');
const Reporte = require('../models/Reporte');
const { formatFecha } = require('./format');

const FORMATO_MONEY = '#,##0';
const ETIQUETAS_ESTADO = { PAGADA: 'Pagada', PENDIENTE: 'Pendiente', PARCIAL: 'Parcial', ANULADA: 'Anulada' };
const ETIQUETAS_TIPO_PAGO = { CONTADO: 'Contado', CREDITO: 'Crédito', PARCIAL: 'Parcial' };
const ETIQUETAS_METODO_PAGO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', OTRO: 'Otro' };

function estiloEncabezado(fila) {
  fila.font = { bold: true };
  fila.eachCell((celda) => {
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  });
}

// ExcelJS exige nombres de hoja únicos y de máximo 31 caracteres, así que
// cuando se combinan los 4 reportes en un solo archivo cada hoja lleva un
// prefijo ("Ventas - Resumen", "Abonos - Detalle", ...) para no chocar entre
// sí; en la exportación individual (un tipo a la vez) el prefijo queda vacío
// y las hojas se llaman simplemente "Resumen"/"Ventas".
function agregarHoja(workbook, nombre, columnas, filas, columnasMoneda = []) {
  const hoja = workbook.addWorksheet(nombre.slice(0, 31));
  hoja.columns = columnas;
  estiloEncabezado(hoja.getRow(1));
  filas.forEach((fila) => hoja.addRow(fila));
  columnasMoneda.forEach((clave) => {
    hoja.getColumn(clave).numFmt = FORMATO_MONEY;
  });
  return hoja;
}

async function agregarReporteVentas(workbook, { usuarioId, filtros, prefijo = '' }) {
  const { fechaInicio, fechaFin, clienteId = '', productoId = '', estado = '' } = filtros;

  const [resumen, listado] = await Promise.all([
    Reporte.reporteVentas({ usuarioId, fechaInicio, fechaFin, clienteId, productoId, estado }),
    Venta.findAll({ usuarioId, clienteId, estado, productoId, fechaInicio, fechaFin, perPage: 100000 })
  ]);

  agregarHoja(
    workbook,
    `${prefijo}Resumen`,
    [
      { header: 'Indicador', key: 'indicador', width: 32 },
      { header: 'Valor', key: 'valor', width: 20 }
    ],
    [
      { indicador: 'Cantidad de ventas', valor: resumen.cantidadVentas },
      { indicador: 'Total vendido', valor: resumen.totalVendido },
      { indicador: 'Total pagado', valor: resumen.totalPagado },
      { indicador: 'Total a crédito', valor: resumen.totalCredito },
      { indicador: 'Total pendiente', valor: resumen.totalPendiente }
    ],
    ['valor']
  );

  agregarHoja(
    workbook,
    `${prefijo}Detalle`,
    [
      { header: '#', key: 'id', width: 8 },
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Cliente', key: 'cliente', width: 28 },
      { header: 'Forma de pago', key: 'tipoPago', width: 16 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Descuento', key: 'descuento', width: 14 },
      { header: 'Total', key: 'total', width: 14 },
      { header: 'Estado', key: 'estado', width: 14 }
    ],
    listado.ventas.map((venta) => ({
      id: venta.id,
      fecha: formatFecha(venta.fecha),
      cliente: venta.cliente_nombre,
      tipoPago: ETIQUETAS_TIPO_PAGO[venta.tipo_pago] || venta.tipo_pago,
      subtotal: Number(venta.subtotal),
      descuento: Number(venta.descuento),
      total: Number(venta.total),
      estado: ETIQUETAS_ESTADO[venta.estado] || venta.estado
    })),
    ['subtotal', 'descuento', 'total']
  );
}

async function agregarReporteAbonos(workbook, { usuarioId, filtros, prefijo = '' }) {
  const { fechaInicio, fechaFin, clienteId = '', metodoPago = '' } = filtros;

  const [resumen, listado] = await Promise.all([
    Reporte.reporteAbonos({ usuarioId, fechaInicio, fechaFin, clienteId, metodoPago }),
    Abono.findAll({ usuarioId, clienteId, metodoPago, fechaInicio, fechaFin, perPage: 100000 })
  ]);

  const filasResumen = [
    { indicador: 'Cantidad de abonos', valor: resumen.cantidadAbonos },
    { indicador: 'Total recibido', valor: resumen.totalRecibido }
  ];
  resumen.porMetodo.forEach((m) => {
    filasResumen.push({ indicador: `Por ${ETIQUETAS_METODO_PAGO[m.metodo_pago] || m.metodo_pago}`, valor: Number(m.total) });
  });

  agregarHoja(
    workbook,
    `${prefijo}Resumen`,
    [
      { header: 'Indicador', key: 'indicador', width: 32 },
      { header: 'Valor', key: 'valor', width: 20 }
    ],
    filasResumen,
    ['valor']
  );

  agregarHoja(
    workbook,
    `${prefijo}Detalle`,
    [
      { header: 'Fecha', key: 'fecha', width: 14 },
      { header: 'Cliente', key: 'cliente', width: 28 },
      { header: 'Método', key: 'metodo', width: 16 },
      { header: 'Observación', key: 'observacion', width: 32 },
      { header: 'Valor', key: 'valor', width: 14 }
    ],
    listado.abonos.map((abono) => ({
      fecha: formatFecha(abono.fecha),
      cliente: abono.cliente_nombre,
      metodo: ETIQUETAS_METODO_PAGO[abono.metodo_pago] || abono.metodo_pago,
      observacion: abono.observacion || '',
      valor: Number(abono.valor)
    })),
    ['valor']
  );
}

async function agregarReporteClientes(workbook, { usuarioId, prefijo = '' }) {
  const [resumenGlobal, mayorSaldo, deudaAntigua] = await Promise.all([
    Cliente.getResumenGlobal(usuarioId),
    Cliente.findMayorDeuda(usuarioId, 100000),
    Cliente.findAntiguedadDeuda(usuarioId, 100000)
  ]);

  agregarHoja(
    workbook,
    `${prefijo}Resumen`,
    [
      { header: 'Indicador', key: 'indicador', width: 32 },
      { header: 'Valor', key: 'valor', width: 20 }
    ],
    [
      { indicador: 'Clientes totales', valor: resumenGlobal.totalClientes },
      { indicador: 'Con deuda', valor: resumenGlobal.clientesConDeuda },
      { indicador: 'Sin deuda', valor: resumenGlobal.totalClientes - resumenGlobal.clientesConDeuda }
    ],
    ['valor']
  );

  agregarHoja(
    workbook,
    `${prefijo}Mayor saldo`,
    [
      { header: 'Cliente', key: 'cliente', width: 28 },
      { header: 'Saldo', key: 'saldo', width: 16 }
    ],
    mayorSaldo.map((c) => ({ cliente: c.nombre, saldo: Number(c.saldo) })),
    ['saldo']
  );

  agregarHoja(
    workbook,
    `${prefijo}Deuda antigua`,
    [
      { header: 'Cliente', key: 'cliente', width: 28 },
      { header: 'Saldo', key: 'saldo', width: 16 },
      { header: 'Días', key: 'dias', width: 10 },
      { header: 'Categoría', key: 'categoria', width: 16 }
    ],
    deudaAntigua.map((c) => {
      const dias = c.dias_antiguedad;
      const categoria =
        dias === null || dias === undefined ? '—' : dias <= 7 ? '0–7 días' : dias <= 30 ? '8–30 días' : 'Más de 30 días';
      return { cliente: c.nombre, saldo: Number(c.saldo), dias, categoria };
    }),
    ['saldo']
  );
}

async function agregarReporteProductos(workbook, { usuarioId, filtros, prefijo = '' }) {
  const { fechaInicio, fechaFin, productoId = '', estado = '' } = filtros;
  const productosMasVendidos = await Producto.findMasVendidos({
    usuarioId,
    fechaInicio,
    fechaFin,
    productoId,
    estado,
    limit: 100000
  });

  agregarHoja(
    workbook,
    `${prefijo}Más vendidos`,
    [
      { header: '#', key: 'indice', width: 6 },
      { header: 'Producto/servicio', key: 'nombre', width: 28 },
      { header: 'Tipo', key: 'tipo', width: 14 },
      { header: 'Cantidad vendida', key: 'cantidad', width: 18 },
      { header: 'Total generado', key: 'total', width: 18 }
    ],
    productosMasVendidos.map((p, indice) => ({
      indice: indice + 1,
      nombre: p.nombre,
      tipo: p.tipo === 'servicio' ? 'Servicio' : 'Producto',
      cantidad: Number(p.cantidad_vendida),
      total: Number(p.total_generado)
    })),
    ['total']
  );
}

function nuevoWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vendora';
  workbook.created = new Date();
  return workbook;
}

// Reutiliza exactamente los mismos modelos y consultas que ya usa
// reporteController (web) y reporteApiController (móvil) para la vista en
// pantalla — el Excel exportado siempre coincide con lo que se ve, porque es
// la misma fuente de datos, solo que sin el límite de 20/50 filas que tiene
// la vista previa en pantalla.
async function construirWorkbook({ tipo, usuarioId, filtros }) {
  const workbook = nuevoWorkbook();

  if (tipo === 'ventas') {
    await agregarReporteVentas(workbook, { usuarioId, filtros });
  } else if (tipo === 'abonos') {
    await agregarReporteAbonos(workbook, { usuarioId, filtros });
  } else if (tipo === 'clientes') {
    await agregarReporteClientes(workbook, { usuarioId });
  } else {
    await agregarReporteProductos(workbook, { usuarioId, filtros });
  }

  return workbook;
}

// Los 4 reportes combinados en un solo archivo, cada uno en sus propias
// hojas con prefijo para que no se choquen los nombres.
async function construirWorkbookCompleto({ usuarioId, filtros }) {
  const workbook = nuevoWorkbook();

  await agregarReporteVentas(workbook, { usuarioId, filtros, prefijo: 'Ventas - ' });
  await agregarReporteAbonos(workbook, { usuarioId, filtros, prefijo: 'Abonos - ' });
  await agregarReporteClientes(workbook, { usuarioId, prefijo: 'Clientes - ' });
  await agregarReporteProductos(workbook, { usuarioId, filtros, prefijo: 'Productos - ' });

  return workbook;
}

function nombreArchivo(tipo) {
  const fecha = new Date().toISOString().slice(0, 10);
  return `vendora-reporte-${tipo}-${fecha}.xlsx`;
}

module.exports = { construirWorkbook, construirWorkbookCompleto, nombreArchivo };
