document.addEventListener('DOMContentLoaded', function () {
  var selectCliente = document.getElementById('cliente_id');
  var inputValor = document.getElementById('valor');
  var elSaldo = document.getElementById('saldo-cliente');

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

    if (!opcion || !opcion.value) {
      elSaldo.classList.add('hidden');
      inputValor.removeAttribute('max');
      return;
    }

    var saldo = Number(opcion.getAttribute('data-saldo')) || 0;

    elSaldo.classList.remove('hidden');
    elSaldo.classList.toggle('text-red-600', saldo > 0);
    elSaldo.classList.toggle('text-green-600', saldo <= 0);
    elSaldo.textContent = saldo > 0
      ? 'Saldo pendiente: ' + formatearMoneda(saldo)
      : 'Este cliente no tiene saldo pendiente.';

    inputValor.setAttribute('max', saldo > 0 ? saldo : 0);
  }

  selectCliente.addEventListener('change', actualizarSaldo);
  actualizarSaldo();
});
