import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert } from 'react-native';
import { listarProductos, alternarActivoProducto } from '../../api/productos';
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

export default function ProductosListScreen({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (opciones = {}) => {
    const { esRefresh = false, q } = opciones;
    esRefresh ? setRefrescando(true) : setCargando(true);
    setError(null);
    try {
      const data = await listarProductos({ q: q !== undefined ? q : search, perPage: 100 });
      setProductos(data.productos);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudieron cargar los productos.'));
    } finally {
      esRefresh ? setRefrescando(false) : setCargando(false);
    }
  }, [search]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => cargar());
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  async function handleToggle(producto) {
    Alert.alert(producto.activo ? 'Desactivar' : 'Activar', producto.nombre, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await alternarActivoProducto(producto.id);
            cargar();
          } catch (err) {
            Alert.alert('Error', extraerMensajeError(err));
          }
        }
      }
    ]);
  }

  if (cargando) {
    return <LoadingView mensaje="Cargando productos..." />;
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TextField
          placeholder="Buscar por nombre"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => cargar({ q: search })}
          returnKeyType="search"
          style={styles.buscador}
        />
        <Button title="+ Nuevo producto/servicio" onPress={() => navigation.navigate('ProductoForm')} />
      </View>

      <ErrorBanner mensaje={error} />

      <FlatList
        data={productos}
        keyExtractor={(item) => String(item.id)}
        refreshing={refrescando}
        onRefresh={() => cargar({ esRefresh: true })}
        ListEmptyComponent={<EmptyState mensaje="No se encontraron productos/servicios." />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('ProductoForm', { id: item.id })}>
            <Card style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                <View style={styles.badges}>
                  <Badge label={item.tipo === 'servicio' ? 'Servicio' : 'Producto'} tono="neutral" />
                  {!item.activo ? <Badge label="Inactivo" tono="neutral" /> : null}
                </View>
              </View>
              <View style={styles.itemDerecha}>
                <Text style={styles.precio}>{formatMoney(item.precio)}</Text>
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
    gap: 6
  },
  nombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6
  },
  precio: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text
  },
  toggle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600'
  }
});
