import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { obtenerCliente, crearCliente, actualizarCliente } from '../../api/clientes';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingView } from '../../components/LoadingView';
import { colors } from '../../theme/colors';

export default function ClienteFormScreen({ route, navigation }) {
  const clienteId = route.params?.id || null;
  const esEdicion = Boolean(clienteId);

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    documento: '',
    observaciones: ''
  });
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar cliente' : 'Nuevo cliente' });
  }, [navigation, esEdicion]);

  useEffect(() => {
    if (!esEdicion) return;
    (async () => {
      try {
        const data = await obtenerCliente(clienteId);
        setForm({
          nombre: data.cliente.nombre || '',
          telefono: data.cliente.telefono || '',
          email: data.cliente.email || '',
          direccion: data.cliente.direccion || '',
          documento: data.cliente.documento || '',
          observaciones: data.cliente.observaciones || ''
        });
      } catch (err) {
        setError(extraerMensajeError(err, 'No se pudo cargar el cliente.'));
      } finally {
        setCargandoInicial(false);
      }
    })();
  }, [clienteId, esEdicion]);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleSubmit() {
    setError(null);
    setGuardando(true);
    try {
      if (esEdicion) {
        await actualizarCliente(clienteId, form);
      } else {
        await crearCliente(form);
      }
      navigation.goBack();
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo guardar el cliente.'));
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoInicial) {
    return <LoadingView mensaje="Cargando cliente..." />;
  }

  return (
    <Screen scroll>
      <Text style={styles.titulo}>{esEdicion ? 'Editar cliente' : 'Nuevo cliente'}</Text>

      <ErrorBanner mensaje={error} />

      <TextField
        label="Nombre completo *"
        value={form.nombre}
        onChangeText={(v) => actualizarCampo('nombre', v)}
        placeholder="Nombre del cliente"
      />
      <TextField
        label="Teléfono"
        value={form.telefono}
        onChangeText={(v) => actualizarCampo('telefono', v)}
        keyboardType="phone-pad"
        placeholder="Número de contacto"
      />
      <TextField
        label="Correo electrónico"
        value={form.email}
        onChangeText={(v) => actualizarCampo('email', v)}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="correo@ejemplo.com"
      />
      <TextField
        label="Dirección"
        value={form.direccion}
        onChangeText={(v) => actualizarCampo('direccion', v)}
        placeholder="Dirección"
      />
      <TextField
        label="Documento"
        value={form.documento}
        onChangeText={(v) => actualizarCampo('documento', v)}
        placeholder="Cédula, NIT, etc. (opcional)"
      />
      <TextField
        label="Observaciones"
        value={form.observaciones}
        onChangeText={(v) => actualizarCampo('observaciones', v)}
        placeholder="Notas adicionales"
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
