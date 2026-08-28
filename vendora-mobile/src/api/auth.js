import { api } from './client';

export function login(email, password) {
  return api.post('/auth/login', { email, password }).then((res) => res.data);
}

export function registro(nombre, email, password, passwordConfirmacion) {
  return api
    .post('/auth/registro', {
      nombre,
      email,
      password,
      password_confirmacion: passwordConfirmacion
    })
    .then((res) => res.data);
}

export function recuperar(email) {
  return api.post('/auth/recuperar', { email }).then((res) => res.data);
}
