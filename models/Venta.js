const pool = require('../config/database');

function errorValidacion(mensaje) {
  const error = new Error(mensaje);
  error.validacion = true;
  return error;
}

async function create({
  usuarioId,
  clienteId,
  detalles,
  descuento = 0,
  pagoInicial = 0,
  metodoPago = null,
  observaciones = null
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[cliente]] = await connection.query(
      'SELECT id FROM clientes WHERE id = ? AND usuario_id = ? AND activo = 1 LIMIT 1',
      [clienteId, usuarioId]
    );
    if (!cliente) {
      throw errorValidacion('El cliente seleccionado no existe o está inactivo.');
    }

    const productoIds = detalles.map((d) => d.productoId);
    const [productos] = await connection.query(
      `SELECT id, precio, activo FROM productos WHERE usuario_id = ? AND id IN (${productoIds.map(() => '?').join(',')})`,
      [usuarioId, ...productoIds]
    );
    const productosPorId = new Map(productos.map((p) => [p.id, p]));

    const detallesCalculados = detalles.map((detalle) => {
      const producto = productosPorId.get(detalle.productoId);
      if (!producto || !producto.activo) {
        throw errorValidacion('Uno de los productos/servicios seleccionados ya no está disponible.');
      }
      const precioUnitario = Number(producto.precio);
      const subtotal = precioUnitario * detalle.cantidad;
      return {
        productoId: producto.id,
        cantidad: detalle.cantidad,
        precioUnitario,
        subtotal
      };
    });

    const subtotal = detallesCalculados.reduce((acumulado, d) => acumulado + d.subtotal, 0);

    if (descuento > subtotal) {
      throw errorValidacion('El descuento no puede ser mayor que el subtotal de la venta.');
    }

    const total = subtotal - descuento;

    if (pagoInicial > total) {
      throw errorValidacion('El pago inicial no puede ser mayor que el total de la venta.');
    }

    let tipoPago;
    let estado;
    if (total <= 0 || pagoInicial >= total) {
      tipoPago = 'CONTADO';
      estado = 'PAGADA';
    } else if (pagoInicial > 0) {
      tipoPago = 'PARCIAL';
      estado = 'PARCIAL';
    } else {
      tipoPago = 'CREDITO';
      estado = 'PENDIENTE';
    }

    const [ventaResultado] = await connection.query(
      `INSERT INTO ventas (cliente_id, usuario_id, subtotal, descuento, total, tipo_pago, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [clienteId, usuarioId, subtotal, descuento, total, tipoPago, estado, observaciones]
    );
    const ventaId = ventaResultado.insertId;

    for (const detalle of detallesCalculados) {
      await connection.query(
        `INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [ventaId, detalle.productoId, detalle.cantidad, detalle.precioUnitario, detalle.subtotal]
      );
    }

    // Solo las ventas PARCIAL generan un abono: su total completo queda en el
    // saldo a crédito del cliente, así que el pago inicial debe registrarse
    // como abono para descontarlo. Las ventas CONTADO nunca entran al cálculo
    // de crédito (ver Cliente.getResumenFinanciero), así que registrar un
    // abono por su pago total crearía un saldo a favor ficticio que cancelaría
    // deuda de otras ventas a crédito del mismo cliente.
    if (tipoPago === 'PARCIAL') {
      await connection.query(
        `INSERT INTO abonos (cliente_id, usuario_id, valor, metodo_pago, observacion)
         VALUES (?, ?, ?, ?, ?)`,
        [clienteId, usuarioId, pagoInicial, metodoPago, `Pago inicial de la venta #${ventaId}`]
      );
    }

    await connection.commit();
    return ventaId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Los abonos se registran a nivel de cliente, no de una venta específica (el
// esquema no tiene abonos.venta_id), así que el estado -y el monto que queda
// pendiente- de cada venta a crédito se recalculan distribuyendo el total
// abonado del cliente entre sus ventas a crédito de la más antigua a la más
// reciente (FIFO): la primera deuda en generarse es la primera en saldarse.
// Esta función es pura (sin acceso a BD) para poder reutilizar exactamente la
// misma distribución tanto al persistir el estado como al calcular reportes.
function calcularAsignacionAbonos(ventasOrdenadas, totalAbonado) {
  let restante = Number(totalAbonado);

  return ventasOrdenadas.map((venta) => {
    const total = Number(venta.total);
    let estado;
    let montoPendiente;

    if (restante >= total) {
      estado = 'PAGADA';
      montoPendiente = 0;
      restante -= total;
    } else if (restante > 0) {
      estado = 'PARCIAL';
      montoPendiente = total - restante;
      restante = 0;
    } else {
      estado = 'PENDIENTE';
      montoPendiente = total;
    }

    return { id: venta.id, total, estado, montoPendiente };
  });
}

async function obtenerVentasCreditoCliente(ejecutor, clienteId, usuarioId) {
  const [rows] = await ejecutor.query(
    `SELECT id, total FROM ventas
     WHERE cliente_id = ? AND usuario_id = ? AND tipo_pago IN ('CREDITO', 'PARCIAL') AND estado != 'ANULADA'
     ORDER BY fecha ASC, id ASC`,
    [clienteId, usuarioId]
  );
  return rows;
}

// tipo_pago nunca cambia aquí (es el registro histórico de cómo se transó la
// venta); solo estado se actualiza, como estado de pago vigente.
async function reconciliarEstadosCliente(connection, clienteId, usuarioId) {
  const ventasCredito = await obtenerVentasCreditoCliente(connection, clienteId, usuarioId);
  if (ventasCredito.length === 0) return;

  const [[{ totalAbonado }]] = await connection.query(
    'SELECT COALESCE(SUM(valor), 0) AS totalAbonado FROM abonos WHERE cliente_id = ? AND usuario_id = ? AND anulado = 0',
    [clienteId, usuarioId]
  );

  const asignaciones = calcularAsignacionAbonos(ventasCredito, totalAbonado);

  for (const asignacion of asignaciones) {
    await connection.query('UPDATE ventas SET estado = ? WHERE id = ?', [asignacion.estado, asignacion.id]);
  }
}

// Igual que reconciliarEstadosCliente, pero de solo lectura: devuelve además
// el monto que realmente sigue pendiente de cada venta (no solo su estado),
// para reportes que necesitan sumar lo pendiente real y no el total bruto de
// las ventas PARCIAL/PENDIENTE.
async function obtenerSaldosCliente(clienteId, usuarioId) {
  const ventasCredito = await obtenerVentasCreditoCliente(pool, clienteId, usuarioId);
  if (ventasCredito.length === 0) return [];

  const [[{ totalAbonado }]] = await pool.query(
    'SELECT COALESCE(SUM(valor), 0) AS totalAbonado FROM abonos WHERE cliente_id = ? AND usuario_id = ? AND anulado = 0',
    [clienteId, usuarioId]
  );

  return calcularAsignacionAbonos(ventasCredito, totalAbonado);
}

async function findAll({
  usuarioId,
  clienteId = '',
  estado = '',
  fechaInicio = '',
  fechaFin = '',
  productoId = '',
  page = 1,
  perPage = 10
} = {}) {
  const condiciones = ['v.usuario_id = ?'];
  const params = [usuarioId];

  if (clienteId) {
    condiciones.push('v.cliente_id = ?');
    params.push(clienteId);
  }

  if (estado) {
    condiciones.push('v.estado = ?');
    params.push(estado);
  }

  if (fechaInicio) {
    condiciones.push('v.fecha >= ?');
    params.push(fechaInicio);
  }

  if (fechaFin) {
    condiciones.push('v.fecha <= ?');
    params.push(`${fechaFin} 23:59:59`);
  }

  if (productoId) {
    condiciones.push('v.id IN (SELECT venta_id FROM detalle_venta WHERE producto_id = ?)');
    params.push(productoId);
  }

  const where = `WHERE ${condiciones.join(' AND ')}`;
  const paginaActual = Math.max(1, page);
  const offset = (paginaActual - 1) * perPage;

  const [rows] = await pool.query(
    `SELECT v.*, c.nombre AS cliente_nombre
     FROM ventas v
     JOIN clientes c ON c.id = v.cliente_id
     ${where}
     ORDER BY v.fecha DESC, v.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(perPage), Number(offset)]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM ventas v ${where}`,
    params
  );

  return { ventas: rows, total };
}

// Corregir una venta mal registrada nunca la modifica ni la borra (se
// perdería el historial financiero): se anula y, si hace falta, se crea una
// venta nueva con los datos correctos. Al anular, la venta deja de contar
// para el crédito/saldo del cliente (ver obtenerVentasCreditoCliente, que ya
// excluye estado != 'ANULADA'), así que se reconcilian sus demás ventas a
// crédito para redistribuir entre ellas cualquier abono que ya se había
// aplicado.
async function anular(id, usuarioId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[venta]] = await connection.query(
      'SELECT id, cliente_id, estado FROM ventas WHERE id = ? AND usuario_id = ? LIMIT 1',
      [id, usuarioId]
    );

    if (!venta) {
      throw errorValidacion('La venta no existe.');
    }
    if (venta.estado === 'ANULADA') {
      throw errorValidacion('Esta venta ya está anulada.');
    }

    await connection.query('UPDATE ventas SET estado = ? WHERE id = ?', ['ANULADA', id]);
    await reconciliarEstadosCliente(connection, venta.cliente_id, usuarioId);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findById(id, usuarioId) {
  const [rows] = await pool.query(
    `SELECT v.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
     FROM ventas v
     JOIN clientes c ON c.id = v.cliente_id
     WHERE v.id = ? AND v.usuario_id = ?
     LIMIT 1`,
    [id, usuarioId]
  );
  return rows[0] || null;
}

async function findDetalles(ventaId, usuarioId) {
  const [rows] = await pool.query(
    `SELECT d.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo
     FROM detalle_venta d
     JOIN ventas v ON v.id = d.venta_id
     JOIN productos p ON p.id = d.producto_id
     WHERE d.venta_id = ? AND v.usuario_id = ?
     ORDER BY d.id ASC`,
    [ventaId, usuarioId]
  );
  return rows;
}

module.exports = {
  create,
  anular,
  findAll,
  findById,
  findDetalles,
  reconciliarEstadosCliente,
  obtenerSaldosCliente
};
