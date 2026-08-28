import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert } from 'react-native';
import { listarClientes, alternarActivoCliente } from '../../api/clientes';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { LoadingView } from '../../components/LoadingView';
import { ErrorBanner } from '../../components/ErrorBanner';
import { EmptyState } from '../../components/EmptyState';
import { formatMoney } from '../../utils/format';
import { colors } from '../../theme/colors';

export default function ClientesListScreen({ navigation }) {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (opciones = {}) => {
    const { esRefresh = false, q } = opciones;
    esRefresh ? setRefrescando(true) : setCargando(true);
    setError(null);
    try {
      const data = await listarClientes({ q: q !== undefined ? q : search, perPage: 100 });
      setClientes(data.clientes);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudieron cargar los clientes.'));
    } finally {
      esRefresh ? setRefrescando(false) : setCargando(false);
    }
  }, [search]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => cargar());
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  function handleSearchSubmit() {
    cargar({ q: search });
  }

  function handleToggle(cliente) {
    Alert.alert(cliente.activo ? 'Desactivar cliente' : 'Activar cliente', cliente.nombre, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await alternarActivoCliente(cliente.id);
            cargar();
          } catch (err) {
            Alert.alert('Error', extraerMensajeError(err));
          }
        }
      }
    ]);
  }

  if (cargando) {
    return <LoadingView mensaje="Cargando clientes..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TextField
          placeholder="Buscar por nombre, teléfono o documento"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          style={styles.buscador}
        />
        <Button title="+ Nuevo cliente" onPress={() => navigation.navigate('ClienteForm')} />
      </View>

      <ErrorBanner mensaje={error} />

      <FlatList
        data={clientes}
        keyExtractor={(item) => String(item.id)}
        refreshing={refrescando}
        onRefresh={() => cargar({ esRefresh: true })}
        ListEmptyComponent={<EmptyState mensaje="No se encontraron clientes." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('ClienteDetail', { id: item.id })}>
            <Card style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                {item.telefono ? <Text style={styles.subtexto}>{item.telefono}</Text> : null}
              </View>
              <View style={styles.itemDerecha}>
                <Text style={[styles.saldo, item.saldo > 0 && styles.saldoDeuda]}>
                  {formatMoney(item.saldo)}
                </Text>
                {!item.activo ? <Badge label="Inactivo" tono="neutral" /> : null}
                <Text style={styles.toggle} onPress={() => handleToggle(item)}>
                  {item.activo ? 'Desactivar' : 'Activar'}
                </Text>
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
    marginBottom: 8
  },
  buscador: {
    marginBottom: 8
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
    gap: 4
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
  saldo: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted
  },
  saldoDeuda: {
    color: colors.danger
  },
  toggle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600'
  }
});
