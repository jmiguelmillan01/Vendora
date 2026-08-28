import { api } from './client';

export function obtenerDashboard(params = {}) {
  return api.get('/dashboard', { params }).then((res) => res.data);
}
