import axios from 'axios';
import { getItemAsync } from '../utils/storage';
import { API_BASE_URL, TOKEN_STORAGE_KEY } from '../config';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.interceptors.request.use(async (config) => {
  const token = await getItemAsync(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AuthContext se suscribe aquí para cerrar sesión automáticamente si el
// backend responde 401 (token vencido o inválido) en cualquier pantalla, sin
// que client.js necesite importar el contexto (evitaría un ciclo de imports).
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// El backend responde { error: '...' } o { errors: ['...', ...] } según el
// caso (ver controllers/api/*.js); esto normaliza ambos a un solo mensaje
// legible para mostrar en la UI sin repetir este switch en cada pantalla.
export function extraerMensajeError(error, mensajePorDefecto = 'Ocurrió un error. Intenta nuevamente.') {
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.';
  }
  const data = error.response.data;
  if (data && Array.isArray(data.errors) && data.errors.length) {
    return data.errors.join('\n');
  }
  if (data && data.error) {
    return data.error;
  }
  return mensajePorDefecto;
}
