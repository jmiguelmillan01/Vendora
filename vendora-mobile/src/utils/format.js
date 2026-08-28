export function formatMoney(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
}

export function formatFecha(fecha) {
  if (!fecha) return '—';
  const soloFecha = String(fecha).slice(0, 10);
  const [anio, mes, dia] = soloFecha.split('-');
  if (!anio || !mes || !dia) return soloFecha;
  return `${dia}/${mes}/${anio}`;
}

export function formatFechaHora(fecha) {
  if (!fecha) return '—';
  const texto = String(fecha).replace(' ', 'T');
  const date = new Date(texto);
  if (Number.isNaN(date.getTime())) return formatFecha(fecha);
  const fechaParte = formatFecha(fecha);
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${fechaParte} ${horas}:${minutos}`;
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function primerDiaMesISO() {
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
}
