import { api } from './client';

export function reporteVentas(params = {}) {
  return api.get('/reportes/ventas', { params }).then((res) => res.data);
}

export function reporteAbonos(params = {}) {
  return api.get('/reportes/abonos', { params }).then((res) => res.data);
}

export function reporteClientes(params = {}) {
  return api.get('/reportes/clientes', { params }).then((res) => res.data);
}

export function reporteProductos(params = {}) {
  return api.get('/reportes/productos', { params }).then((res) => res.data);
}

// El archivo llega como binario (xlsx), no JSON — arraybuffer preserva los
// bytes exactos para poder guardarlo/compartirlo tal cual en el celular.
export function exportarReporte(tipo, params = {}) {
  return api.get(`/reportes/${tipo}/exportar`, { params, responseType: 'arraybuffer' }).then((res) => res.data);
}

// Los 4 reportes (ventas, abonos, clientes, productos) en un solo archivo.
export function exportarReporteCompleto(params = {}) {
  return api.get('/reportes/exportar', { params, responseType: 'arraybuffer' }).then((res) => res.data);
}
