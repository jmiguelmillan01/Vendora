document.addEventListener('DOMContentLoaded', function () {
  var dataEl = document.getElementById('dashboard-data');
  if (!dataEl || typeof Chart === 'undefined') return;

  var datos = JSON.parse(dataEl.textContent);

  var COLOR_VENTAS = '#2a78d6';
  var COLOR_CREDITOS = '#eb6834';
  var COLOR_ABONOS = '#1baf7a';
  var COLOR_GRID = '#e1e0d9';
  var COLOR_TEXTO = '#52514e';
  var COLOR_SUPERFICIE = '#fcfcfb';

  var formatoMoneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

  var NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  Chart.defaults.font.family = "system-ui, -apple-system, 'Segoe UI', sans-serif";
  Chart.defaults.color = COLOR_TEXTO;

  function formatearEtiquetaDia(fechaIso) {
    var partes = fechaIso.split('-');
    return partes[2] + '/' + partes[1];
  }

  function formatearEtiquetaMes(mesIso) {
    var partes = mesIso.split('-');
    return NOMBRES_MES[Number(partes[1]) - 1] + ' ' + partes[0].slice(2);
  }

  function opcionesBase() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (contexto) {
              var valor = contexto.parsed.y != null ? contexto.parsed.y : contexto.parsed.x;
              return formatoMoneda.format(valor);
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: COLOR_GRID },
          ticks: {
            callback: function (valor) { return formatoMoneda.format(valor); }
          }
        }
      }
    };
  }

  function crearGraficoLinea(idCanvas, serie, color, etiquetaFn) {
    var canvas = document.getElementById(idCanvas);
    if (!canvas || !serie || serie.length === 0) return;

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: serie.map(function (fila) { return etiquetaFn(fila.periodo); }),
        datasets: [{
          data: serie.map(function (fila) { return Number(fila.total); }),
          borderColor: color,
          backgroundColor: color + '1A',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: color,
          pointBorderColor: COLOR_SUPERFICIE,
          pointBorderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: opcionesBase()
    });
  }

  function crearGraficoBarras(idCanvas, serie, color, etiquetaFn) {
    var canvas = document.getElementById(idCanvas);
    if (!canvas || !serie || serie.length === 0) return;

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: serie.map(function (fila) { return etiquetaFn(fila.periodo); }),
        datasets: [{
          data: serie.map(function (fila) { return Number(fila.total); }),
          backgroundColor: color,
          borderRadius: 4,
          borderSkipped: 'bottom',
          maxBarThickness: 24
        }]
      },
      options: opcionesBase()
    });
  }

  crearGraficoLinea('grafico-ventas-dia', datos.ventasPorDia, COLOR_VENTAS, formatearEtiquetaDia);
  crearGraficoBarras('grafico-ventas-mes', datos.ventasPorMes, COLOR_VENTAS, formatearEtiquetaMes);
  crearGraficoBarras('grafico-creditos-periodo', datos.creditosPorPeriodo, COLOR_CREDITOS, formatearEtiquetaDia);
  crearGraficoBarras('grafico-abonos-periodo', datos.abonosPorPeriodo, COLOR_ABONOS, formatearEtiquetaDia);

  var canvasProductos = document.getElementById('grafico-productos-vendidos');
  if (canvasProductos && datos.productosMasVendidos && datos.productosMasVendidos.length > 0) {
    new Chart(canvasProductos, {
      type: 'bar',
      data: {
        labels: datos.productosMasVendidos.map(function (p) { return p.nombre; }),
        datasets: [{
          data: datos.productosMasVendidos.map(function (p) { return Number(p.cantidad_vendida); }),
          backgroundColor: COLOR_VENTAS,
          borderRadius: 4,
          borderSkipped: 'left',
          maxBarThickness: 24
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (contexto) {
                return contexto.parsed.x + ' unidades vendidas';
              }
            }
          }
        },
        scales: {
          x: { beginAtZero: true, grid: { color: COLOR_GRID } },
          y: { grid: { display: false } }
        }
      }
    });
  }
});
