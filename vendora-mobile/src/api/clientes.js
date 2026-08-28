import { api } from './client';

export function listarClientes(params = {}) {
  return api.get('/clientes', { params }).then((res) => res.data);
}

export function obtenerCliente(id, params = {}) {
  return api.get(`/clientes/${id}`, { params }).then((res) => res.data);
}

export function crearCliente(datos) {
  return api.post('/clientes', datos).then((res) => res.data);
}

export function actualizarCliente(id, datos) {
  return api.put(`/clientes/${id}`, datos).then((res) => res.data);
}

export function alternarActivoCliente(id) {
  return api.post(`/clientes/${id}/toggle`).then((res) => res.data);
}
