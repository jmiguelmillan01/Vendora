document.addEventListener('DOMContentLoaded', function () {
  var ICONO_OJO =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path d="M10 3.5c-4.14 0-7.68 2.57-9.14 6.2a1 1 0 0 0 0 .6C2.32 13.93 5.86 16.5 10 16.5s7.68-2.57 9.14-6.2a1 1 0 0 0 0-.6C17.68 6.07 14.14 3.5 10 3.5Zm0 10.5a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/></svg>';
  var ICONO_OJO_TACHADO =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.86-1.86c1.68-1.16 3-2.83 3.78-4.8a1 1 0 0 0 0-.6C17.98 6.07 14.44 3.5 10.3 3.5c-1.6 0-3.1.38-4.42 1.06L3.28 2.22Zm4.9 4.9 1.35 1.35a2 2 0 0 1 2.4 2.4l1.35 1.35a4 4 0 0 0-5.1-5.1ZM10.3 15.5c-4.14 0-7.68-2.57-9.14-6.2a1 1 0 0 1 0-.6c.55-1.36 1.4-2.56 2.46-3.53l1.44 1.44c-.82.73-1.5 1.65-1.96 2.7C4.32 12.93 7.15 15 10.3 15c.85 0 1.66-.14 2.4-.4l1.28 1.28c-1.1.4-2.3.62-3.68.62Z"/></svg>';

  // Cada campo de contraseña ya viene envuelto en el HTML en un contenedor
  // con la etiqueta y el input apilados adentro (ver password-field.ejs);
  // aquí solo se agrega el botón del ojo, centrado verticalmente sobre todo
  // el contenedor (etiqueta + valor), no solo sobre el input.
  document.querySelectorAll('[data-password-field]').forEach(function (wrapper) {
    var input = wrapper.querySelector('input[type="password"]');
    if (!input) return;

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className =
      'absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 focus:outline-none';
    boton.setAttribute('aria-label', 'Mostrar contraseña');
    boton.innerHTML = ICONO_OJO;
    wrapper.appendChild(boton);

    boton.addEventListener('click', function () {
      var mostrando = input.type === 'text';
      input.type = mostrando ? 'password' : 'text';
      boton.innerHTML = mostrando ? ICONO_OJO : ICONO_OJO_TACHADO;
      boton.setAttribute('aria-label', mostrando ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
  });
});
