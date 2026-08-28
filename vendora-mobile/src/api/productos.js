import { api } from './client';

export function listarProductos(params = {}) {
  return api.get('/productos', { params }).then((res) => res.data);
}

export function obtenerProducto(id) {
  return api.get(`/productos/${id}`).then((res) => res.data);
}

export function crearProducto(datos) {
  return api.post('/productos', datos).then((res) => res.data);
}

export function actualizarProducto(id, datos) {
  return api.put(`/productos/${id}`, datos).then((res) => res.data);
}

export function alternarActivoProducto(id) {
  return api.post(`/productos/${id}/toggle`).then((res) => res.data);
}
