import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Guarda el archivo en la caché de la app y abre la hoja nativa de
// compartir/guardar (WhatsApp, Drive, "Guardar en archivos", etc.) — el
// celular no tiene una carpeta de descargas accesible directamente como un
// navegador, así que este es el flujo estándar en apps móviles.
export async function guardarYCompartirArchivo(arrayBuffer, nombreArchivo, mimeType) {
  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    throw new Error('Compartir archivos no está disponible en este dispositivo.');
  }

  const file = new File(Paths.cache, nombreArchivo);
  file.create({ overwrite: true });
  file.write(new Uint8Array(arrayBuffer));

  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Guardar o compartir reporte' });
}
