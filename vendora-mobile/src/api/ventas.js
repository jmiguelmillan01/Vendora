import { api } from './client';

export function listarVentas(params = {}) {
  return api.get('/ventas', { params }).then((res) => res.data);
}

export function obtenerVenta(id) {
  return api.get(`/ventas/${id}`).then((res) => res.data);
}

export function crearVenta(datos) {
  return api.post('/ventas', datos).then((res) => res.data);
}

export function anularVenta(id) {
  return api.post(`/ventas/${id}/anular`).then((res) => res.data);
}
