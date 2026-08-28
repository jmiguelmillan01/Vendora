import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { obtenerVenta, anularVenta } from '../../api/ventas';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingView } from '../../components/LoadingView';
import { ErrorBanner } from '../../components/ErrorBanner';
import { formatMoney, formatFechaHora } from '../../utils/format';
import { colors } from '../../theme/colors';

export default function VentaDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [venta, setVenta] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [anulando, setAnulando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerVenta(id);
      setVenta(data.venta);
      setDetalles(data.detalles);
      navigation.setOptions({ title: `Venta #${data.venta.id}` });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo cargar la venta.'));
    } finally {
      setCargando(false);
    }
  }, [id, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargar);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, id]);

  function handleAnular() {
    Alert.alert(
      '¿Anular esta venta?',
      'La venta quedará marcada como anulada y dejará de contar en el saldo del cliente. Esta acción no se puede deshacer; si fue un error, deberás registrar una venta nueva con los datos correctos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Anular',
          style: 'destructive',
          onPress: async () => {
            setAnulando(true);
            try {
              await anularVenta(id);
              cargar();
            } catch (err) {
              Alert.alert('Error', extraerMensajeError(err));
            } finally {
              setAnulando(false);
            }
          }
        }
      ]
    );
  }

  if (cargando && !venta) {
    return <LoadingView mensaje="Cargando venta..." />;
  }

  if (!venta) {
    return (
      <Screen>
        <ErrorBanner mensaje={error} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ErrorBanner mensaje={error} />

      <Card>
        <View style={styles.filaEncabezado}>
          <Text style={styles.cliente}>{venta.cliente_nombre}</Text>
          <Badge label={venta.estado} />
        </View>
        <Text style={styles.dato}>{formatFechaHora(venta.fecha)}</Text>
        <Text style={styles.dato}>Tipo de pago: {venta.tipo_pago}</Text>
        {venta.observaciones ? <Text style={styles.dato}>Obs: {venta.observaciones}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.seccionTitulo}>Productos / servicios</Text>
        {detalles.map((d) => (
          <View key={d.id} style={styles.detalleFila}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detalleNombre}>{d.producto_nombre}</Text>
              <Text style={styles.detalleSub}>
                {d.cantidad} × {formatMoney(d.precio_unitario)}
              </Text>
            </View>
            <Text style={styles.detalleSubtotal}>{formatMoney(d.subtotal)}</Text>
          </View>
        ))}

        <View style={styles.totalFila}>
          <Text style={styles.totalEtiqueta}>Subtotal</Text>
          <Text style={styles.totalValor}>{formatMoney(venta.subtotal)}</Text>
        </View>
        <View style={styles.totalFila}>
          <Text style={styles.totalEtiqueta}>Descuento</Text>
          <Text style={styles.totalValor}>{formatMoney(venta.descuento)}</Text>
        </View>
        <View style={styles.totalFila}>
          <Text style={styles.totalEtiquetaGrande}>Total</Text>
          <Text style={styles.totalValorGrande}>{formatMoney(venta.total)}</Text>
        </View>
      </Card>

      {venta.estado !== 'ANULADA' ? (
        <Button title="Anular venta" variant="danger" onPress={handleAnular} loading={anulando} />
      ) : (
        <Text style={styles.avisoAnulada}>
          Esta venta está anulada. Si fue un error, registra una venta nueva con los datos correctos.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filaEncabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cliente: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text
  },
  dato: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12
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
  detalleSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text
  },
  totalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
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
  },
  avisoAnulada: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    padding: 12
  }
});
