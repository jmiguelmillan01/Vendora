document.addEventListener('DOMContentLoaded', function () {
  var btnAbrir = document.getElementById('btn-abrir-menu');
  var btnCerrar = document.getElementById('btn-cerrar-menu');
  var drawer = document.getElementById('drawer-menu');
  var overlay = document.getElementById('drawer-overlay');

  if (!btnAbrir || !drawer || !overlay) return;

  function abrirMenu() {
    drawer.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  function cerrarMenu() {
    drawer.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  btnAbrir.addEventListener('click', abrirMenu);
  if (btnCerrar) btnCerrar.addEventListener('click', cerrarMenu);
  overlay.addEventListener('click', cerrarMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrarMenu();
  });
});
