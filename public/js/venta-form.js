document.addEventListener('DOMContentLoaded', function () {
  var contenedor = document.getElementById('filas-detalle');
  var plantilla = document.getElementById('plantilla-fila');
  var btnAgregar = document.getElementById('btn-agregar-fila');

  if (!contenedor || !plantilla || !btnAgregar) return;

  var inputDescuento = document.getElementById('descuento');
  var inputPagoInicial = document.getElementById('pago_inicial');
  var campoMetodoPago = document.getElementById('campo-metodo-pago');
  var selectMetodoPago = document.getElementById('metodo_pago');
  var btnPagoCompleto = document.getElementById('btn-pago-completo');
  var btnSinPago = document.getElementById('btn-sin-pago');
  var elSubtotal = document.getElementById('resumen-subtotal');
  var elTotal = document.getElementById('resumen-total');
  var elSaldo = document.getElementById('resumen-saldo');

  var totalActual = 0;

  function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  function actualizarBotonesEliminar() {
    var filas = contenedor.querySelectorAll('.fila-detalle');
    filas.forEach(function (fila) {
      var boton = fila.querySelector('.btn-eliminar-fila');
      var deshabilitar = filas.length <= 1;
      boton.disabled = deshabilitar;
      boton.classList.toggle('opacity-30', deshabilitar);
      boton.classList.toggle('pointer-events-none', deshabilitar);
    });
  }

  function recalcularTotales() {
    var subtotalGeneral = 0;

    contenedor.querySelectorAll('.fila-detalle').forEach(function (fila) {
      var select = fila.querySelector('.fila-producto');
      var cantidadInput = fila.querySelector('.fila-cantidad');
      var subtotalEl = fila.querySelector('.fila-subtotal');
      var opcion = select.options[select.selectedIndex];
      var precio = opcion ? Number(opcion.getAttribute('data-precio')) || 0 : 0;
      var cantidad = Number(cantidadInput.value) || 0;
      var subtotalFila = precio * cantidad;
      subtotalEl.textContent = formatearMoneda(subtotalFila);
      subtotalGeneral += subtotalFila;
    });

    var descuento = Number(inputDescuento.value) || 0;
    var total = Math.max(0, subtotalGeneral - descuento);
    var pagoInicial = Number(inputPagoInicial.value) || 0;
    var saldo = Math.max(0, total - pagoInicial);

    totalActual = total;

    elSubtotal.textContent = formatearMoneda(subtotalGeneral);
    elTotal.textContent = formatearMoneda(total);
    elSaldo.textContent = formatearMoneda(saldo);

    campoMetodoPago.classList.toggle('hidden', pagoInicial <= 0);
    selectMetodoPago.required = pagoInicial > 0;
  }

  function agregarFila() {
    var nodo = plantilla.content.cloneNode(true);
    contenedor.appendChild(nodo);
    actualizarBotonesEliminar();
    recalcularTotales();
  }

  btnAgregar.addEventListener('click', agregarFila);

  contenedor.addEventListener('click', function (e) {
    var boton = e.target.closest('.btn-eliminar-fila');
    if (!boton || boton.disabled) return;
    boton.closest('.fila-detalle').remove();
    actualizarBotonesEliminar();
    recalcularTotales();
  });

  contenedor.addEventListener('input', recalcularTotales);
  contenedor.addEventListener('change', recalcularTotales);
  inputDescuento.addEventListener('input', recalcularTotales);
  inputPagoInicial.addEventListener('input', recalcularTotales);

  btnPagoCompleto.addEventListener('click', function () {
    inputPagoInicial.value = totalActual.toFixed(2);
    recalcularTotales();
  });

  btnSinPago.addEventListener('click', function () {
    inputPagoInicial.value = '0';
    recalcularTotales();
  });

  agregarFila();
});
