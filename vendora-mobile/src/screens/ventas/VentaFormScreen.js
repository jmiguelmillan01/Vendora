import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { listarClientes } from '../../api/clientes';
import { listarProductos } from '../../api/productos';
import { crearVenta } from '../../api/ventas';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingView } from '../../components/LoadingView';
import { formatMoney } from '../../utils/format';
import { colors } from '../../theme/colors';

const METODOS_PAGO = [
  { label: 'Efectivo', value: 'EFECTIVO' },
  { label: 'Transferencia', value: 'TRANSFERENCIA' },
  { label: 'Otro', value: 'OTRO' }
];

export default function VentaFormScreen({ route, navigation }) {
  const clienteIdInicial = route.params?.clienteId ? String(route.params.clienteId) : '';

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [detalles, setDetalles] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [descuento, setDescuento] = useState('0');
  const [pagoInicial, setPagoInicial] = useState('0');
  const [metodoPago, setMetodoPago] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [clientesData, productosData] = await Promise.all([
          listarClientes({ activo: '1', perPage: 200 }),
          listarProductos({ activo: '1', perPage: 200 })
        ]);
        setClientes(clientesData.clientes);
        setProductos(productosData.productos);
      } catch (err) {
        setError(extraerMensajeError(err, 'No se pudieron cargar clientes/productos.'));
      } finally {
        setCargandoInicial(false);
      }
    })();
  }, []);

  const subtotal = useMemo(
    () => detalles.reduce((acc, d) => acc + d.precio * d.cantidad, 0),
    [detalles]
  );
  const total = Math.max(0, subtotal - (Number(descuento) || 0));

  function handleAgregarProducto() {
    if (!productoSeleccionado) return;
    const cantidadNum = Number(cantidad);
    if (!cantidadNum || cantidadNum <= 0) return;

    const producto = productos.find((p) => String(p.id) === String(productoSeleccionado));
    if (!producto) return;

    setDetalles((prev) => {
      const existente = prev.find((d) => d.productoId === producto.id);
      if (existente) {
        return prev.map((d) =>
          d.productoId === producto.id ? { ...d, cantidad: d.cantidad + cantidadNum } : d
        );
      }
      return [
        ...prev,
        { productoId: producto.id, nombre: producto.nombre, precio: Number(producto.precio), cantidad: cantidadNum }
      ];
    });
    setProductoSeleccionado('');
    setCantidad('1');
  }

  function handleQuitarDetalle(productoId) {
    setDetalles((prev) => prev.filter((d) => d.productoId !== productoId));
  }

  const handleSubmit = useCallback(async () => {
    setError(null);
    setGuardando(true);
    try {
      const venta = await crearVenta({
        clienteId: Number(clienteId),
        detalles: detalles.map((d) => ({ productoId: d.productoId, cantidad: d.cantidad })),
        descuento: Number(descuento) || 0,
        pagoInicial: Number(pagoInicial) || 0,
        metodoPago: Number(pagoInicial) > 0 ? metodoPago : null,
        observaciones
      });
      navigation.replace('VentaDetail', { id: venta.venta.id });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar la venta.'));
    } finally {
      setGuardando(false);
    }
  }, [clienteId, detalles, descuento, pagoInicial, metodoPago, observaciones, navigation]);

  if (cargandoInicial) {
    return <LoadingView mensaje="Cargando..." />;
  }

  return (
    <Screen scroll>
      <Text style={styles.titulo}>Nueva venta</Text>

      <ErrorBanner mensaje={error} />

      <SelectField
        label="Cliente *"
        value={clienteId}
        onValueChange={setClienteId}
        options={clientes.map((c) => ({ label: c.nombre, value: String(c.id) }))}
        placeholder="Selecciona un cliente"
      />

      <Card>
        <Text style={styles.seccionTitulo}>Productos / servicios</Text>
        <SelectField
          label="Producto o servicio"
          value={productoSeleccionado}
          onValueChange={setProductoSeleccionado}
          options={productos.map((p) => ({ label: `${p.nombre} — ${formatMoney(p.precio)}`, value: String(p.id) }))}
          placeholder="Selecciona un producto"
        />
        <View style={styles.filaAgregar}>
          <TextField
            label="Cantidad"
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="decimal-pad"
            style={styles.cantidadInput}
          />
          <Button title="Agregar" variant="outline" onPress={handleAgregarProducto} style={styles.botonAgregar} />
        </View>

        {detalles.length === 0 ? (
          <Text style={styles.vacio}>Agrega al menos un producto o servicio.</Text>
        ) : (
          detalles.map((d) => (
            <View key={d.productoId} style={styles.detalleFila}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detalleNombre}>{d.nombre}</Text>
                <Text style={styles.detalleSub}>
                  {d.cantidad} × {formatMoney(d.precio)} = {formatMoney(d.cantidad * d.precio)}
                </Text>
              </View>
              <Text style={styles.quitar} onPress={() => handleQuitarDetalle(d.productoId)}>
                Quitar
              </Text>
            </View>
          ))
        )}
      </Card>

      <TextField
        label="Descuento"
        value={descuento}
        onChangeText={setDescuento}
        keyboardType="decimal-pad"
      />
      <TextField
        label="Pago inicial"
        value={pagoInicial}
        onChangeText={setPagoInicial}
        keyboardType="decimal-pad"
      />
      {Number(pagoInicial) > 0 ? (
        <SelectField
          label="Método de pago *"
          value={metodoPago}
          onValueChange={setMetodoPago}
          options={METODOS_PAGO}
          placeholder="Selecciona un método"
        />
      ) : null}
      <TextField
        label="Observaciones"
        value={observaciones}
        onChangeText={setObservaciones}
        multiline
        numberOfLines={3}
      />

      <Card>
        <View style={styles.totalFila}>
          <Text style={styles.totalEtiqueta}>Subtotal</Text>
          <Text style={styles.totalValor}>{formatMoney(subtotal)}</Text>
        </View>
        <View style={styles.totalFila}>
          <Text style={styles.totalEtiquetaGrande}>Total</Text>
          <Text style={styles.totalValorGrande}>{formatMoney(total)}</Text>
        </View>
      </Card>

      <Button title="Registrar venta" onPress={handleSubmit} loading={guardando} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12
  },
  filaAgregar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  cantidadInput: {
    flex: 1
  },
  botonAgregar: {
    marginTop: 22
  },
  vacio: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4
  },
  detalleFila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  detalleNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text
  },
  detalleSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2
  },
  quitar: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600'
  },
  totalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  totalEtiqueta: {
    fontSize: 14,
    color: colors.textMuted
  },
  totalValor: {
    fontSize: 14,
    color: colors.text
  },
  totalEtiquetaGrande: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  totalValorGrande: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary
  }
});
