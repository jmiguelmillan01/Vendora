document.addEventListener('DOMContentLoaded', function () {
  var selectPreset = document.getElementById('preset');
  var inputInicio = document.getElementById('fechaInicio');
  var inputFin = document.getElementById('fechaFin');

  if (!selectPreset || !inputInicio || !inputFin) return;

  function marcarPersonalizado() {
    selectPreset.value = 'personalizado';
  }

  inputInicio.addEventListener('change', marcarPersonalizado);
  inputFin.addEventListener('change', marcarPersonalizado);
});
