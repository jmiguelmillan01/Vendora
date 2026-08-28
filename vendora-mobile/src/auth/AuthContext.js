import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getItemAsync, setItemAsync, deleteItemAsync } from '../utils/storage';
import { TOKEN_STORAGE_KEY, USUARIO_STORAGE_KEY } from '../config';
import { setUnauthorizedHandler } from '../api/client';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, usuarioGuardado] = await Promise.all([
          getItemAsync(TOKEN_STORAGE_KEY),
          getItemAsync(USUARIO_STORAGE_KEY)
        ]);
        if (token && usuarioGuardado) {
          setUsuario(JSON.parse(usuarioGuardado));
        }
      } finally {
        setCargandoSesion(false);
      }
    })();
  }, []);

  const cerrarSesion = useCallback(async () => {
    await Promise.all([
      deleteItemAsync(TOKEN_STORAGE_KEY),
      deleteItemAsync(USUARIO_STORAGE_KEY)
    ]);
    setUsuario(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      cerrarSesion();
    });
  }, [cerrarSesion]);

  const guardarSesion = useCallback(async (token, usuarioNuevo) => {
    await Promise.all([
      setItemAsync(TOKEN_STORAGE_KEY, token),
      setItemAsync(USUARIO_STORAGE_KEY, JSON.stringify(usuarioNuevo))
    ]);
    setUsuario(usuarioNuevo);
  }, []);

  const iniciarSesion = useCallback(
    async (email, password) => {
      const data = await authApi.login(email, password);
      await guardarSesion(data.token, data.usuario);
      return data.usuario;
    },
    [guardarSesion]
  );

  const registrarse = useCallback(
    async (nombre, email, password, passwordConfirmacion) => {
      const data = await authApi.registro(nombre, email, password, passwordConfirmacion);
      await guardarSesion(data.token, data.usuario);
      return data.usuario;
    },
    [guardarSesion]
  );

  const value = useMemo(
    () => ({
      usuario,
      cargandoSesion,
      autenticado: Boolean(usuario),
      iniciarSesion,
      registrarse,
      cerrarSesion
    }),
    [usuario, cargandoSesion, iniciarSesion, registrarse, cerrarSesion]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider.');
  }
  return context;
}
