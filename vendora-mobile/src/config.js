// URL base del backend (el mismo servidor Express que sirve la web, bajo
// /api/v1). `localhost` NO funciona desde un celular físico ni desde la
// mayoría de emuladores: hay que apuntar a la IP de la máquina donde corre
// `node app.js` en tu red local (ej. http://192.168.1.10:3000/api/v1), o a la
// URL pública del backend ya desplegado (ej. Railway) cuando no estés
// probando contra un servidor local.
//
// Emulador Android (AVD): 10.0.2.2 apunta al localhost de la máquina host.
// Simulador iOS: localhost sí funciona porque comparte la red del Mac.
// Dispositivo físico (Expo Go): usa la IP local de tu máquina, no localhost.
// Con el teléfono conectado por USB y `adb reverse tcp:3006 tcp:3006`
// (depuración USB), localhost en el teléfono apunta directo a esta PC — ya no
// hace falta la IP de la red Wi-Fi. Si vuelves a probar por Wi-Fi/LAN sin
// cable, cambia esto de nuevo a http://<IP-de-tu-PC>:3006/api/v1.
export const API_BASE_URL = 'http://localhost:3006/api/v1';

export const TOKEN_STORAGE_KEY = 'vendora_token';
export const USUARIO_STORAGE_KEY = 'vendora_usuario';
