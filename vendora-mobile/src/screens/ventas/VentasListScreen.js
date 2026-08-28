import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { listarVentas } from '../../api/ventas';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { LoadingView } from '../../components/LoadingView';
import { ErrorBanner } from '../../components/ErrorBanner';
import { EmptyState } from '../../components/EmptyState';
import { formatMoney, formatFecha } from '../../utils/format';
import { colors } from '../../theme/colors';

export default function VentasListScreen({ navigation }) {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (esRefresh = false) => {
    esRefresh ? setRefrescando(true) : setCargando(true);
    setError(null);
    try {
      const data = await listarVentas({ perPage: 50 });
      setVentas(data.ventas);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudieron cargar las ventas.'));
    } finally {
      esRefresh ? setRefrescando(false) : setCargando(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => cargar());
    return unsubscribe;
  }, [navigation, cargar]);

  if (cargando) {
    return <LoadingView mensaje="Cargando ventas..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.titulo}>Ventas</Text>
        <Button title="+ Nueva venta" onPress={() => navigation.navigate('VentaForm')} />
      </View>

      <ErrorBanner mensaje={error} />

      <FlatList
        data={ventas}
        keyExtractor={(item) => String(item.id)}
        refreshing={refrescando}
        onRefresh={() => cargar(true)}
        ListEmptyComponent={<EmptyState mensaje="Todavía no hay ventas registradas." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('VentaDetail', { id: item.id })}>
            <Card style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.nombre}>{item.cliente_nombre}</Text>
                <Text style={styles.subtexto}>
                  {formatFecha(item.fecha)} · {item.tipo_pago}
                </Text>
              </View>
              <View style={styles.itemDerecha}>
                <Text style={styles.total}>{formatMoney(item.total)}</Text>
                <Badge label={item.estado} />
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemInfo: {
    flex: 1
  },
  itemDerecha: {
    alignItems: 'flex-end',
    gap: 6
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  subtexto: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2
  },
  total: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text
  }
});
