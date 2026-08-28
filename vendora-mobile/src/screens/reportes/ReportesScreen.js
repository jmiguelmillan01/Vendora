import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import * as reportesApi from '../../api/reportes';
import { extraerMensajeError } from '../../api/client';
import { guardarYCompartirArchivo } from '../../utils/exportarArchivo';
import { Screen } from '../../components/Screen';
import { SelectField } from '../../components/SelectField';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingView } from '../../components/LoadingView';
import { ErrorBanner } from '../../components/ErrorBanner';
import { EmptyState } from '../../components/EmptyState';
import { formatMoney, formatFecha } from '../../utils/format';
import { colors } from '../../theme/colors';

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const PRESETS = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Ayer', value: 'ayer' },
  { label: 'Esta semana', value: 'semana' },
  { label: 'Este mes', value: 'mes' },
  { label: 'Mes anterior', value: 'mes_anterior' }
];

const TIPOS = [
  { value: 'ventas', etiqueta: 'Ventas' },
  { value: 'abonos', etiqueta: 'Abonos' },
  { value: 'clientes', etiqueta: 'Clientes' },
  { value: 'productos', etiqueta: 'Productos' }
];

// Clientes es el único reporte que no se filtra por período (igual que en la
// web: Cliente.getResumenGlobal/findMayorDeuda/findAntiguedadDeuda son
// estados actuales, no algo que "pasó" en un rango de fechas).
const USA_PERIODO = { ventas: true, abonos: true, clientes: false, productos: true };

const CARGAR_POR_TIPO = {
  ventas: (preset) => reportesApi.reporteVentas({ preset }),
  abonos: (preset) => reportesApi.reporteAbonos({ preset }),
  clientes: () => reportesApi.reporteClientes(),
  productos: (preset) => reportesApi.reporteProductos({ preset })
};

function Tab({ etiqueta, activo, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, activo && styles.tabActivo]}>
      <Text style={[styles.tabTexto, activo && styles.tabTextoActivo]}>{etiqueta}</Text>
    </Pressable>
  );
}

export default function ReportesScreen() {
  const [tipo, setTipo] = useState('ventas');
  const [preset, setPreset] = useState('mes');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);
  const [exportandoTodo, setExportandoTodo] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await CARGAR_POR_TIPO[tipo](preset);
      setDatos(data);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo cargar el reporte.'));
    } finally {
      setCargando(false);
    }
  }, [tipo, preset]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiarTipo(nuevoTipo) {
    setDatos(null);
    setTipo(nuevoTipo);
  }

  function cambiarPreset(nuevoPreset) {
    setDatos(null);
    setPreset(nuevoPreset);
  }

  async function handleExportar() {
    setExportando(true);
    try {
      const params = USA_PERIODO[tipo] ? { preset } : {};
      const arrayBuffer = await reportesApi.exportarReporte(tipo, params);
      const fecha = new Date().toISOString().slice(0, 10);
      await guardarYCompartirArchivo(arrayBuffer, `vendora-reporte-${tipo}-${fecha}.xlsx`, MIME_XLSX);
    } catch (err) {
      Alert.alert('No se pudo exportar', extraerMensajeError(err, 'Intenta nuevamente.'));
    } finally {
      setExportando(false);
    }
  }

  async function handleExportarTodo() {
    setExportandoTodo(true);
    try {
      const arrayBuffer = await reportesApi.exportarReporteCompleto({ preset });
      const fecha = new Date().toISOString().slice(0, 10);
      await guardarYCompartirArchivo(arrayBuffer, `vendora-reporte-todo-${fecha}.xlsx`, MIME_XLSX);
    } catch (err) {
      Alert.alert('No se pudo exportar', extraerMensajeError(err, 'Intenta nuevamente.'));
    } finally {
      setExportandoTodo(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={styles.titulo}>Reportes</Text>

      <View style={styles.tabs}>
        {TIPOS.map((t) => (
          <Tab key={t.value} etiqueta={t.etiqueta} activo={tipo === t.value} onPress={() => cambiarTipo(t.value)} />
        ))}
      </View>

      {USA_PERIODO[tipo] ? (
        <SelectField label="Periodo" value={preset} onValueChange={cambiarPreset} options={PRESETS} />
      ) : null}

      <View style={styles.exportarFila}>
        <Button
          title="Exportar este reporte"
          variant="outline"
          onPress={handleExportar}
          loading={exportando}
          style={styles.exportarBoton}
        />
        <Button
          title="Exportar todo"
          variant="outline"
          onPress={handleExportarTodo}
          loading={exportandoTodo}
          style={styles.exportarBoton}
        />
      </View>

      <ErrorBanner mensaje={error} />

      {cargando ? (
        <LoadingView mensaje="Cargando reporte..." />
      ) : !datos ? null : tipo === 'ventas' ? (
        <>
          <View style={styles.grid}>
            <Card style={styles.indicador}>
              <Text style={styles.indicadorValor}>{datos.resumen.cantidadVentas}</Text>
              <Text style={styles.indicadorEtiqueta}>Ventas</Text>
            </Card>
            <Card style={styles.indicador}>
              <Text style={styles.indicadorValor}>{formatMoney(datos.resumen.totalVendido)}</Text>
              <Text style={styles.indicadorEtiqueta}>Total vendido</Text>
            </Card>
            <Card style={styles.indicador}>
              <Text style={styles.indicadorValor}>{formatMoney(datos.resumen.totalPagado)}</Text>
              <Text style={styles.indicadorEtiqueta}>Pagado</Text>
            </Card>
            <Card style={styles.indicador}>
              <Text style={styles.indicadorValor}>{formatMoney(datos.resumen.totalPendiente)}</Text>
              <Text style={styles.indicadorEtiqueta}>Pendiente</Text>
            </Card>
          </View>

          <Card>
            <Text style={styles.seccionTitulo}>Ventas del período</Text>
            {datos.ventas.length === 0 ? (
              <Text style={styles.vacio}>Sin ventas en este período.</Text>
            ) : (
              datos.ventas.map((v) => (
                <View key={v.id} style={styles.fila}>
                  <View>
                    <Text style={styles.filaTexto}>{v.cliente_nombre}</Text>
                    <Text style={styles.filaSub}>{formatFecha(v.fecha)}</Text>
                  </View>
                  <Text style={styles.filaValor}>{formatMoney(v.total)}</Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : tipo === 'abonos' ? (
        <>
          <View style={styles.grid}>
            <Card style={styles.indicador}>
              <Text style={styles.indicadorValor}>{datos.resumen.cantidadAbonos}</Text>
              <Text style={styles.indicadorEtiqueta}>Abonos</Text>
            </Card>
            <Card style={styles.indicador}>
              <Text style={styles.indicadorValor}>{formatMoney(datos.resumen.totalRecibido)}</Text>
              <Text style={styles.indicadorEtiqueta}>Total recibido</Text>
            </Card>
          </View>

          <Card>
            <Text style={styles.seccionTitulo}>Por método de pago</Text>
            {datos.resumen.porMetodo.map((m) => (
              <View key={m.metodo_pago} style={styles.fila}>
                <Text style={styles.filaTexto}>{m.metodo_pago}</Text>
                <Text style={styles.filaValor}>{formatMoney(m.total)}</Text>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={styles.seccionTitulo}>Abonos del período</Text>
            {datos.abonos.length === 0 ? (
              <Text style={styles.vacio}>Sin abonos en este período.</Text>
            ) : (
              datos.abonos.map((a) => (
                <View key={a.id} style={styles.fila}>
                  <View>
                    <Text style={styles.filaTexto}>{a.cliente_nombre}</Text>
                    <Text style={styles.filaSub}>{formatFecha(a.fecha)}</Text>
                  </View>
                  <Text style={styles.filaValor}>{formatMoney(a.valor)}</Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : tipo === 'clientes' ? (
        <>
          <View style={styles.grid}>
            <Card style={styles.indicador}>
              <Text style={styles.indicadorValor}>{datos.resumen.totalClientes}</Text>
              <Text style={styles.indicadorEtiqueta}>Clientes</Text>
            </Card>
            <Card style={styles.indicador}>
              <Text style={styles.indicadorValor}>{datos.resumen.clientesConDeuda}</Text>
              <Text style={styles.indicadorEtiqueta}>Con deuda</Text>
            </Card>
            <Card style={styles.indicador}>
              <Text style={styles.indicadorValor}>{datos.resumen.clientesSinDeuda}</Text>
              <Text style={styles.indicadorEtiqueta}>Sin deuda</Text>
            </Card>
          </View>

          <Card>
            <Text style={styles.seccionTitulo}>Mayor saldo pendiente</Text>
            {datos.mayorSaldo.length === 0 ? (
              <EmptyState mensaje="Ningún cliente tiene deuda pendiente." />
            ) : (
              datos.mayorSaldo.map((c) => (
                <View key={c.id} style={styles.fila}>
                  <Text style={styles.filaTexto}>{c.nombre}</Text>
                  <Text style={styles.filaValor}>{formatMoney(c.saldo)}</Text>
                </View>
              ))
            )}
          </Card>

          <Card>
            <Text style={styles.seccionTitulo}>Deuda más antigua</Text>
            {datos.deudaAntigua.length === 0 ? (
              <EmptyState mensaje="Ningún cliente tiene deuda pendiente." />
            ) : (
              datos.deudaAntigua.map((c) => (
                <View key={c.id} style={styles.fila}>
                  <View>
                    <Text style={styles.filaTexto}>{c.nombre}</Text>
                    <Text style={styles.filaSub}>{c.categoria}</Text>
                  </View>
                  <Text style={styles.filaValor}>{formatMoney(c.saldo)}</Text>
                </View>
              ))
            )}
          </Card>
        </>
      ) : (
        <Card>
          <Text style={styles.seccionTitulo}>Productos/servicios más vendidos</Text>
          {datos.productosMasVendidos.length === 0 ? (
            <EmptyState mensaje="Sin ventas en este período." />
          ) : (
            datos.productosMasVendidos.map((p) => (
              <View key={p.id} style={styles.fila}>
                <View>
                  <Text style={styles.filaTexto}>{p.nombre}</Text>
                  <Text style={styles.filaSub}>{p.cantidad_vendida} unidades</Text>
                </View>
                <Text style={styles.filaValor}>{formatMoney(p.total_generado)}</Text>
              </View>
            ))
          )}
        </Card>
      )}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.neutralBg,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  tabActivo: {
    backgroundColor: colors.surface
  },
  tabTexto: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 13
  },
  tabTextoActivo: {
    color: colors.primary
  },
  exportarFila: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  exportarBoton: {
    flex: 1
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
    fontSize: 17,
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
