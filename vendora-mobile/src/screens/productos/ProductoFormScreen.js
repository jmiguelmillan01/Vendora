import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { obtenerProducto, crearProducto, actualizarProducto } from '../../api/productos';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingView } from '../../components/LoadingView';
import { colors } from '../../theme/colors';

const TIPOS = [
  { label: 'Producto', value: 'producto' },
  { label: 'Servicio', value: 'servicio' }
];

export default function ProductoFormScreen({ route, navigation }) {
  const productoId = route.params?.id || null;
  const esEdicion = Boolean(productoId);

  const [form, setForm] = useState({ nombre: '', descripcion: '', tipo: 'producto', precio: '' });
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar producto/servicio' : 'Nuevo producto/servicio' });
  }, [navigation, esEdicion]);

  useEffect(() => {
    if (!esEdicion) return;
    (async () => {
      try {
        const data = await obtenerProducto(productoId);
        setForm({
          nombre: data.producto.nombre || '',
          descripcion: data.producto.descripcion || '',
          tipo: data.producto.tipo || 'producto',
          precio: String(data.producto.precio ?? '')
        });
      } catch (err) {
        setError(extraerMensajeError(err, 'No se pudo cargar el producto.'));
      } finally {
        setCargandoInicial(false);
      }
    })();
  }, [productoId, esEdicion]);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit() {
    setError(null);
    setGuardando(true);
    try {
      if (esEdicion) {
        await actualizarProducto(productoId, form);
      } else {
        await crearProducto(form);
      }
      navigation.goBack();
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo guardar el producto/servicio.'));
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoInicial) {
    return <LoadingView mensaje="Cargando producto..." />;
  }

  return (
    <Screen scroll>
      <Text style={styles.titulo}>{esEdicion ? 'Editar producto/servicio' : 'Nuevo producto/servicio'}</Text>

      <ErrorBanner mensaje={error} />

      <TextField
        label="Nombre *"
        value={form.nombre}
        onChangeText={(v) => actualizarCampo('nombre', v)}
        placeholder="Nombre del producto o servicio"
      />
      <SelectField
        label="Tipo *"
        value={form.tipo}
        onValueChange={(v) => actualizarCampo('tipo', v)}
        options={TIPOS}
        placeholder="Selecciona un tipo"
      />
      <TextField
        label="Precio *"
        value={form.precio}
        onChangeText={(v) => actualizarCampo('precio', v)}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <TextField
        label="Descripción"
        value={form.descripcion}
        onChangeText={(v) => actualizarCampo('descripcion', v)}
        placeholder="Descripción opcional"
        multiline
        numberOfLines={3}
      />

      <Button title="Guardar" onPress={handleSubmit} loading={guardando} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16
  }
});
