import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { listarAbonos, anularAbono } from '../../api/abonos';
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

export default function AbonosListScreen({ navigation }) {
  const [abonos, setAbonos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (esRefresh = false) => {
    esRefresh ? setRefrescando(true) : setCargando(true);
    setError(null);
    try {
      const data = await listarAbonos({ perPage: 50 });
      setAbonos(data.abonos);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudieron cargar los abonos.'));
    } finally {
      esRefresh ? setRefrescando(false) : setCargando(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => cargar());
    return unsubscribe;
  }, [navigation, cargar]);

  function handleAnular(abono) {
    Alert.alert(
      '¿Anular este abono?',
      `${abono.cliente_nombre} — ${formatMoney(abono.valor)}. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Anular',
          style: 'destructive',
          onPress: async () => {
            try {
              await anularAbono(abono.id);
              cargar();
            } catch (err) {
              Alert.alert('Error', extraerMensajeError(err));
            }
          }
        }
      ]
    );
  }

  if (cargando) {
    return <LoadingView mensaje="Cargando abonos..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.titulo}>Abonos</Text>
        <Button title="+ Nuevo abono" onPress={() => navigation.navigate('AbonoForm')} />
      </View>

      <ErrorBanner mensaje={error} />

      <FlatList
        data={abonos}
        keyExtractor={(item) => String(item.id)}
        refreshing={refrescando}
        onRefresh={() => cargar(true)}
        ListEmptyComponent={<EmptyState mensaje="Todavía no hay abonos registrados." />}
        renderItem={({ item }) => (
          <Card style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={[styles.nombre, item.anulado && styles.textoTachado]}>{item.cliente_nombre}</Text>
              <Text style={styles.subtexto}>
                {formatFecha(item.fecha)} · {item.metodo_pago}
              </Text>
            </View>
            <View style={styles.itemDerecha}>
              <Text style={[styles.valor, item.anulado && styles.textoTachado]}>{formatMoney(item.valor)}</Text>
              <Badge label={item.anulado ? 'Anulado' : 'Activo'} />
              {!item.anulado ? (
                <Text style={styles.anular} onPress={() => handleAnular(item)}>
                  Anular
                </Text>
              ) : null}
            </View>
          </Card>
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
  valor: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text
  },
  textoTachado: {
    textDecorationLine: 'line-through',
    color: colors.textMuted
  },
  anular: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600'
  }
});
