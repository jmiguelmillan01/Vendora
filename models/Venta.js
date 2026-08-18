const pool = require('../config/database');

function errorValidacion(mensaje) {
  const error = new Error(mensaje);
  error.validacion = true;
  return error;
}

async function create({
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
      'SELECT id FROM clientes WHERE id = ? AND activo = 1 LIMIT 1',
      [clienteId]
    );
    if (!cliente) {
      throw errorValidacion('El cliente seleccionado no existe o está inactivo.');
    }

    const productoIds = detalles.map((d) => d.productoId);
    const [productos] = await connection.query(
      `SELECT id, precio, activo FROM productos WHERE id IN (${productoIds.map(() => '?').join(',')})`,
      productoIds
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
      `INSERT INTO ventas (cliente_id, subtotal, descuento, total, tipo_pago, estado, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clienteId, subtotal, descuento, total, tipoPago, estado, observaciones]
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
        `INSERT INTO abonos (cliente_id, valor, metodo_pago, observacion)
         VALUES (?, ?, ?, ?)`,
        [clienteId, pagoInicial, metodoPago, `Pago inicial de la venta #${ventaId}`]
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

async function findAll({
  clienteId = '',
  estado = '',
  fechaInicio = '',
  fechaFin = '',
  page = 1,
  perPage = 10
} = {}) {
  const condiciones = [];
  const params = [];

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

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
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

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT v.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
     FROM ventas v
     JOIN clientes c ON c.id = v.cliente_id
     WHERE v.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findDetalles(ventaId) {
  const [rows] = await pool.query(
    `SELECT d.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo
     FROM detalle_venta d
     JOIN productos p ON p.id = d.producto_id
     WHERE d.venta_id = ?
     ORDER BY d.id ASC`,
    [ventaId]
  );
  return rows;
}

module.exports = {
  create,
  findAll,
  findById,
  findDetalles
};
