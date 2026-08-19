const PRESETS = ['hoy', 'ayer', 'semana', 'mes', 'mes_anterior', 'personalizado'];

function toISODate(date) {
  const copia = new Date(date);
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset());
  return copia.toISOString().slice(0, 10);
}

function resolveDateRange(query) {
  const preset = PRESETS.includes(query.preset) ? query.preset : 'mes';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let fechaInicio;
  let fechaFin = hoy;

  switch (preset) {
    case 'hoy':
      fechaInicio = hoy;
      break;
    case 'ayer': {
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      fechaInicio = ayer;
      fechaFin = ayer;
      break;
    }
    case 'semana': {
      const diaSemana = hoy.getDay();
      const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1;
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(fechaInicio.getDate() - diasDesdeElLunes);
      break;
    }
    case 'mes':
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      break;
    case 'mes_anterior':
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      break;
    case 'personalizado':
      fechaInicio = query.fechaInicio ? new Date(`${query.fechaInicio}T00:00:00`) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fechaFin = query.fechaFin ? new Date(`${query.fechaFin}T00:00:00`) : hoy;
      break;
    default:
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }

  return {
    preset,
    fechaInicio: toISODate(fechaInicio),
    fechaFin: toISODate(fechaFin)
  };
}

module.exports = { resolveDateRange, PRESETS };
