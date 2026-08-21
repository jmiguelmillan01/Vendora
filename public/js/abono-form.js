document.addEventListener('DOMContentLoaded', function () {
  var selectCliente = document.getElementById('cliente_id');
  var inputValor = document.getElementById('valor');
  var elSaldo = document.getElementById('saldo-cliente');
  var contenedorSugerencias = document.getElementById('sugerencias-abono');
  var botonesSugerencia = contenedorSugerencias
    ? contenedorSugerencias.querySelectorAll('.btn-sugerencia-abono')
    : [];

  if (!selectCliente || !inputValor || !elSaldo) return;

  function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  function actualizarSaldo() {
    var opcion = selectCliente.options[selectCliente.selectedIndex];
    var saldo = opcion ? Number(opcion.getAttribute('data-saldo')) || 0 : 0;

    if (!opcion || !opcion.value || saldo <= 0) {
      elSaldo.classList.add('hidden');
      inputValor.removeAttribute('max');
      if (contenedorSugerencias) contenedorSugerencias.classList.add('hidden');
      return;
    }

    elSaldo.classList.remove('hidden');
    elSaldo.classList.add('text-red-600');
    elSaldo.classList.remove('text-green-600');
    elSaldo.textContent = 'Saldo pendiente: ' + formatearMoneda(saldo);

    inputValor.setAttribute('max', saldo);

    if (contenedorSugerencias) {
      contenedorSugerencias.classList.remove('hidden');
      botonesSugerencia.forEach(function (boton) {
        var porcentaje = Number(boton.getAttribute('data-porcentaje'));
        var monto = Math.round((saldo * porcentaje) / 100);
        boton.setAttribute('data-monto', monto);
        if (porcentaje < 100) {
          boton.textContent = porcentaje + '% · ' + formatearMoneda(monto);
        } else {
          boton.textContent = 'Pagar todo · ' + formatearMoneda(monto);
        }
      });
    }
  }

  botonesSugerencia.forEach(function (boton) {
    boton.addEventListener('click', function () {
      var monto = boton.getAttribute('data-monto');
      if (monto) {
        inputValor.value = monto;
      }
    });
  });

  selectCliente.addEventListener('change', actualizarSaldo);
  actualizarSaldo();
});
