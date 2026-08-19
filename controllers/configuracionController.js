const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

function showChangePassword(req, res) {
  res.render('configuracion/index', {
    titulo: 'Configuración',
    activeNav: 'configuracion',
    errores: []
  });
}

function validarCambioPassword(body) {
  const errores = [];
  const { password_actual: passwordActual, password_nueva: passwordNueva, password_confirmacion: passwordConfirmacion } = body;

  if (!passwordActual) {
    errores.push('Debes ingresar tu contraseña actual.');
  }

  if (!passwordNueva || passwordNueva.length < 6) {
    errores.push('La nueva contraseña debe tener al menos 6 caracteres.');
  }

  if (passwordNueva !== passwordConfirmacion) {
    errores.push('La confirmación no coincide con la nueva contraseña.');
  }

  return errores;
}

async function changePassword(req, res, next) {
  try {
    const errores = validarCambioPassword(req.body);
    const usuario = await Usuario.findByIdConPassword(req.session.usuario.id);

    if (!errores.length) {
      const passwordValida = usuario && (await bcrypt.compare(req.body.password_actual, usuario.password));
      if (!passwordValida) {
        errores.push('La contraseña actual no es correcta.');
      }
    }

    if (errores.length) {
      return res.status(400).render('configuracion/index', {
        titulo: 'Configuración',
        activeNav: 'configuracion',
        errores
      });
    }

    const nuevoHash = await bcrypt.hash(req.body.password_nueva, 10);
    await Usuario.updatePassword(usuario.id, nuevoHash);

    req.session.flash = { type: 'success', message: 'Contraseña actualizada correctamente.' };
    res.redirect('/configuracion');
  } catch (error) {
    next(error);
  }
}

module.exports = { showChangePassword, changePassword };
