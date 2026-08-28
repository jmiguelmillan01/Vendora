import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { listarClientes } from '../../api/clientes';
import { crearAbono } from '../../api/abonos';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingView } from '../../components/LoadingView';
import { formatMoney } from '../../utils/format';
import { colors } from '../../theme/colors';

const METODOS_PAGO = [
  { label: 'Efectivo', value: 'EFECTIVO' },
  { label: 'Transferencia', value: 'TRANSFERENCIA' },
  { label: 'Otro', value: 'OTRO' }
];

const SUGERENCIAS = [
  { etiqueta: '25%', porcentaje: 25 },
  { etiqueta: '50%', porcentaje: 50 },
  { etiqueta: '75%', porcentaje: 75 },
  { etiqueta: 'Pagar todo', porcentaje: 100 }
];

export default function AbonoFormScreen({ route, navigation }) {
  const clienteIdInicial = route.params?.clienteId ? String(route.params.clienteId) : '';

  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(clienteIdInicial);
  const [valor, setValor] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [observacion, setObservacion] = useState('');
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listarClientes({ activo: '1', perPage: 200 });
        setClientes(data.clientes);
      } catch (err) {
        setError(extraerMensajeError(err, 'No se pudieron cargar los clientes.'));
      } finally {
        setCargandoInicial(false);
      }
    })();
  }, []);

  const clienteSeleccionado = useMemo(
    () => clientes.find((c) => String(c.id) === String(clienteId)),
    [clientes, clienteId]
  );
  const saldo = Number(clienteSeleccionado?.saldo) || 0;

  async function handleSubmit() {
    setError(null);
    setGuardando(true);
    try {
      await crearAbono({ clienteId: Number(clienteId), valor: Number(valor), metodoPago, observacion });
      navigation.goBack();
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar el abono.'));
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoInicial) {
    return <LoadingView mensaje="Cargando..." />;
  }

  return (
    <Screen scroll>
      <Text style={styles.titulo}>Nuevo abono</Text>

      <ErrorBanner mensaje={error} />

      <SelectField
        label="Cliente *"
        value={clienteId}
        onValueChange={(v) => {
          setClienteId(v);
          setValor('');
        }}
        options={clientes.map((c) => ({ label: `${c.nombre} — ${formatMoney(c.saldo)}`, value: String(c.id) }))}
        placeholder="Selecciona un cliente"
      />

      {clienteSeleccionado && saldo > 0 ? (
        <View style={styles.sugerencias}>
          {SUGERENCIAS.map((s) => (
            <Text
              key={s.etiqueta}
              style={styles.chip}
              onPress={() => setValor(String(Math.round((saldo * s.porcentaje) / 100)))}
            >
              {s.etiqueta}
            </Text>
          ))}
        </View>
      ) : null}

      <TextField
        label="Valor del abono *"
        value={valor}
        onChangeText={setValor}
        keyboardType="decimal-pad"
        placeholder="0"
      />
      <SelectField
        label="Método de pago *"
        value={metodoPago}
        onValueChange={setMetodoPago}
        options={METODOS_PAGO}
        placeholder="Selecciona un método"
      />
      <TextField
        label="Observación"
        value={observacion}
        onChangeText={setObservacion}
        placeholder="Notas adicionales"
        multiline
        numberOfLines={3}
      />

      <Button title="Registrar abono" onPress={handleSubmit} loading={guardando} />
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
  sugerencias: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.primary,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999
  }
});
