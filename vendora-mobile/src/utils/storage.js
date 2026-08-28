import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store solo soporta Android/iOS (usa Keystore/Keychain, que no
// existen en un navegador). La app está pensada para correr como app nativa,
// pero `expo start --web` es útil para probar la UI rápido en el navegador
// durante el desarrollo, así que en web se cae a localStorage. No es
// almacenamiento cifrado, pero web nunca es el destino real de la app (ver
// especificación: Android e iOS vía React Native/Expo).
const esWeb = Platform.OS === 'web';

export async function getItemAsync(key) {
  if (esWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key, value) {
  if (esWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Sin almacenamiento disponible (modo privado, etc.): la sesión
      // simplemente no persistirá entre recargas en web.
    }
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key) {
  if (esWeb) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignorar
    }
    return;
  }
  return SecureStore.deleteItemAsync(key);
}
