import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { obtenerDashboard } from '../../api/dashboard';
import { extraerMensajeError } from '../../api/client';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { LoadingView } from '../../components/LoadingView';
import { ErrorBanner } from '../../components/ErrorBanner';
import { formatMoney, formatFecha } from '../../utils/format';
import { colors } from '../../theme/colors';

const anchoPantalla = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: colors.surface,
  backgroundGradientTo: colors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  propsForBackgroundLines: { stroke: colors.border }
};

function Indicador({ etiqueta, valor }) {
  return (
    <Card style={styles.indicador}>
      <Text style={styles.indicadorValor}>{valor}</Text>
      <Text style={styles.indicadorEtiqueta}>{etiqueta}</Text>
    </Card>
  );
}

export default function DashboardScreen({ navigation }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async (esRefresh = false) => {
    esRefresh ? setRefrescando(true) : setCargando(true);
    setError(null);
    try {
      const data = await obtenerDashboard();
      setDatos(data);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo cargar el dashboard.'));
    } finally {
      esRefresh ? setRefrescando(false) : setCargando(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => cargar());
    return unsubscribe;
  }, [navigation, cargar]);

  if (cargando) {
    return <LoadingView mensaje="Cargando dashboard..." />;
  }

  const ventasPorMes = datos?.graficos?.ventasPorMes || [];
  const tieneDatosMes = ventasPorMes.length > 0;

  return (
    <Screen scroll refreshing={refrescando} onRefresh={() => cargar(true)}>
      <Text style={styles.titulo}>Dashboard</Text>

      <ErrorBanner mensaje={error} />

      {datos ? (
        <>
          <View style={styles.grid}>
            <Indicador etiqueta="Ventas de hoy" valor={formatMoney(datos.indicadores.ventasHoy)} />
            <Indicador etiqueta="Ventas del mes" valor={formatMoney(datos.indicadores.ventasMes)} />
            <Indicador etiqueta="Crédito del mes" valor={formatMoney(datos.indicadores.ventasCreditoMes)} />
            <Indicador etiqueta="Abonos del mes" valor={formatMoney(datos.indicadores.abonosMes)} />
            <Indicador etiqueta="Total pendiente" valor={formatMoney(datos.indicadores.totalPendiente)} />
            <Indicador etiqueta="Clientes con deuda" valor={String(datos.indicadores.clientesConDeuda)} />
          </View>

          {tieneDatosMes ? (
            <Card>
              <Text style={styles.seccionTitulo}>Ventas por mes</Text>
              <BarChart
                data={{
                  labels: ventasPorMes.map((v) => v.periodo.slice(2)),
                  datasets: [{ data: ventasPorMes.map((v) => Number(v.total)) }]
                }}
                width={anchoPantalla - 64}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                chartConfig={chartConfig}
                style={styles.chart}
              />
            </Card>
          ) : null}

          <Card>
            <Text style={styles.seccionTitulo}>Clientes con mayor deuda</Text>
            {datos.clientesMayorDeuda.length === 0 ? (
              <Text style={styles.vacio}>Ningún cliente tiene deuda pendiente.</Text>
            ) : (
              datos.clientesMayorDeuda.map((cliente) => (
                <View key={cliente.id} style={styles.fila}>
                  <Text style={styles.filaTexto}>{cliente.nombre}</Text>
                  <Text style={styles.filaValor}>{formatMoney(cliente.saldo)}</Text>
                </View>
              ))
            )}
          </Card>

          <Card>
            <Text style={styles.seccionTitulo}>Ventas recientes</Text>
            {datos.ventasRecientes.length === 0 ? (
              <Text style={styles.vacio}>Todavía no hay ventas registradas.</Text>
            ) : (
              datos.ventasRecientes.map((venta) => (
                <View key={venta.id} style={styles.fila}>
                  <View>
                    <Text style={styles.filaTexto}>{venta.cliente_nombre}</Text>
                    <Text style={styles.filaSub}>{formatFecha(venta.fecha)}</Text>
                  </View>
                  <Text style={styles.filaValor}>{formatMoney(venta.total)}</Text>
                </View>
              ))
            )}
          </Card>

          <Card>
            <Text style={styles.seccionTitulo}>Abonos recientes</Text>
            {datos.abonosRecientes.length === 0 ? (
              <Text style={styles.vacio}>Todavía no hay abonos registrados.</Text>
            ) : (
              datos.abonosRecientes.map((abono) => (
                <View key={abono.id} style={styles.fila}>
                  <View>
                    <Text style={styles.filaTexto}>{abono.cliente_nombre}</Text>
                    <Text style={styles.filaSub}>{formatFecha(abono.fecha)}</Text>
                  </View>
                  <Text style={styles.filaValor}>{formatMoney(abono.valor)}</Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  indicador: {
    width: '48%'
  },
  indicadorValor: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary
  },
  indicadorEtiqueta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12
  },
  chart: {
    borderRadius: 12,
    marginLeft: -16
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  filaTexto: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600'
  },
  filaSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2
  },
  filaValor: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text
  },
  vacio: {
    color: colors.textMuted,
    fontSize: 14
  }
});
