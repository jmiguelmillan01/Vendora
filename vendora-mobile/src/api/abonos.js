import { api } from './client';

export function listarAbonos(params = {}) {
  return api.get('/abonos', { params }).then((res) => res.data);
}

export function crearAbono(datos) {
  return api.post('/abonos', datos).then((res) => res.data);
}

export function anularAbono(id) {
  return api.post(`/abonos/${id}/anular`).then((res) => res.data);
}
