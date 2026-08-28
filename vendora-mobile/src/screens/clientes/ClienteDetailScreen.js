import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { obtenerCliente, alternarActivoCliente } from '../../api/clientes';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { Badge } from '../../components/Badge';
import { LoadingView } from '../../components/LoadingView';
import { ErrorBanner } from '../../components/ErrorBanner';
import { EmptyState } from '../../components/EmptyState';
import { formatMoney, formatFecha } from '../../utils/format';
import { colors } from '../../theme/colors';

export default function ClienteDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [cliente, setCliente] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerCliente(id, { fechaInicio, fechaFin });
      setCliente(data.cliente);
      setResumen(data.resumen);
      setHistorial(data.historial);
      navigation.setOptions({ title: data.cliente.nombre });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo cargar el cliente.'));
    } finally {
      setCargando(false);
    }
  }, [id, fechaInicio, fechaFin, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargar);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, id]);

  async function handleToggleActivo() {
    const accion = cliente.activo ? 'desactivar' : 'activar';
    Alert.alert(`¿${accion === 'activar' ? 'Activar' : 'Desactivar'} cliente?`, cliente.nombre, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await alternarActivoCliente(id);
            cargar();
          } catch (err) {
            Alert.alert('Error', extraerMensajeError(err));
          }
        }
      }
    ]);
  }

  if (cargando && !cliente) {
    return <LoadingView mensaje="Cargando cliente..." />;
  }

  if (!cliente) {
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
          <Text style={styles.nombre}>{cliente.nombre}</Text>
          {!cliente.activo ? <Badge label="Inactivo" tono="neutral" /> : null}
        </View>
        {cliente.telefono ? <Text style={styles.dato}>Tel: {cliente.telefono}</Text> : null}
        {cliente.email ? <Text style={styles.dato}>{cliente.email}</Text> : null}
        {cliente.direccion ? <Text style={styles.dato}>{cliente.direccion}</Text> : null}
        {cliente.documento ? <Text style={styles.dato}>Doc: {cliente.documento}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.saldoEtiqueta}>Saldo pendiente</Text>
        <Text style={[styles.saldoValor, resumen.saldo > 0 && styles.saldoDeuda]}>
          {formatMoney(resumen.saldo)}
        </Text>
        <View style={styles.resumenFila}>
          <View>
            <Text style={styles.resumenEtiqueta}>Total a crédito</Text>
            <Text style={styles.resumenValor}>{formatMoney(resumen.totalCredito)}</Text>
          </View>
          <View>
            <Text style={styles.resumenEtiqueta}>Total abonado</Text>
            <Text style={styles.resumenValor}>{formatMoney(resumen.totalAbonado)}</Text>
          </View>
        </View>
        <Text style={styles.resumenFechas}>Última compra: {formatFecha(resumen.fechaUltimaCompra)}</Text>
        <Text style={styles.resumenFechas}>Último abono: {formatFecha(resumen.fechaUltimoAbono)}</Text>
      </Card>

      <View style={styles.acciones}>
        <Button
          title="Nueva venta"
          onPress={() => navigation.navigate('VentasTab', { screen: 'VentaForm', params: { clienteId: id } })}
          style={styles.accionBoton}
        />
        <Button
          title="Nuevo abono"
          variant="outline"
          onPress={() => navigation.navigate('AbonosTab', { screen: 'AbonoForm', params: { clienteId: id } })}
          style={styles.accionBoton}
        />
      </View>

      <View style={styles.acciones}>
        <Button
          title="Editar"
          variant="neutral"
          onPress={() => navigation.navigate('ClienteForm', { id })}
          style={styles.accionBoton}
        />
        <Button
          title={cliente.activo ? 'Desactivar' : 'Activar'}
          variant={cliente.activo ? 'danger' : 'neutral'}
          onPress={handleToggleActivo}
          style={styles.accionBoton}
        />
      </View>

      <Card>
        <Text style={styles.seccionTitulo}>Historial</Text>
        <View style={styles.filtroFechas}>
          <TextField
            label="Desde"
            value={fechaInicio}
            onChangeText={setFechaInicio}
            placeholder="AAAA-MM-DD"
            style={styles.filtroInput}
          />
          <TextField
            label="Hasta"
            value={fechaFin}
            onChangeText={setFechaFin}
            placeholder="AAAA-MM-DD"
            style={styles.filtroInput}
          />
        </View>
        <Button title="Filtrar" variant="outline" onPress={cargar} />

        {historial.length === 0 ? (
          <EmptyState mensaje="Sin movimientos en este rango." />
        ) : (
          historial.map((mov) => (
            <View key={`${mov.tipo}-${mov.id}`} style={styles.movFila}>
              <View style={styles.movInfo}>
                <Text style={styles.movDescripcion}>{mov.descripcion}</Text>
                <Text style={styles.movFecha}>{formatFecha(mov.fecha)}</Text>
              </View>
              <Text style={[styles.movValor, mov.valor < 0 ? styles.movAbono : styles.movVenta]}>
                {formatMoney(mov.valor)}
              </Text>
            </View>
          ))
        )}
      </Card>
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
  nombre: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text
  },
  dato: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2
  },
  saldoEtiqueta: {
    fontSize: 14,
    color: colors.textMuted
  },
  saldoValor: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.success,
    marginTop: 4,
    marginBottom: 12
  },
  saldoDeuda: {
    color: colors.danger
  },
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  resumenEtiqueta: {
    fontSize: 12,
    color: colors.textMuted
  },
  resumenValor: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2
  },
  resumenFechas: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2
  },
  acciones: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  accionBoton: {
    flex: 1
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12
  },
  filtroFechas: {
    flexDirection: 'row',
    gap: 12
  },
  filtroInput: {
    flex: 1
  },
  movFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  movInfo: {
    flex: 1
  },
  movDescripcion: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text
  },
  movFecha: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  movValor: {
    fontSize: 15,
    fontWeight: '700'
  },
  movVenta: {
    color: colors.text
  },
  movAbono: {
    color: colors.success
  }
});
