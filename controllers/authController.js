const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail } = require('../utils/mailer');

const TOKEN_TTL_MINUTOS = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES) || 30;

function showLogin(req, res) {
  res.render('auth/login', {
    titulo: 'Iniciar sesión',
    error: null,
    email: ''
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('auth/login', {
      titulo: 'Iniciar sesión',
      error: 'Debes ingresar correo y contraseña.',
      email: email || ''
    });
  }

  try {
    const emailNormalizado = email.trim().toLowerCase();
    const usuario = await Usuario.findByEmail(emailNormalizado);

    if (!usuario) {
      return res.status(401).render('auth/login', {
        titulo: 'Iniciar sesión',
        error: 'Correo o contraseña incorrectos.',
        email
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).render('auth/login', {
        titulo: 'Iniciar sesión',
        error: 'Correo o contraseña incorrectos.',
        email
      });
    }

    req.session.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    };

    return res.redirect('/');
  } catch (error) {
    console.error('Error en login:', error.message);
    return res.status(500).render('auth/login', {
      titulo: 'Iniciar sesión',
      error: 'Ocurrió un error al iniciar sesión. Intenta nuevamente.',
      email
    });
  }
}

function showRegister(req, res) {
  res.render('auth/register', {
    titulo: 'Crear cuenta',
    errores: [],
    valores: { nombre: '', email: '' }
  });
}

function validarRegistro(body) {
  const errores = [];
  const nombre = (body.nombre || '').trim();
  const email = (body.email || '').trim();
  const password = body.password || '';
  const passwordConfirmacion = body.password_confirmacion || '';

  if (!nombre) {
    errores.push('El nombre es obligatorio.');
  } else if (nombre.length > 150) {
    errores.push('El nombre no puede superar los 150 caracteres.');
  }

  if (!email) {
    errores.push('El correo electrónico es obligatorio.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.push('El correo electrónico no es válido.');
  } else if (email.length > 150) {
    errores.push('El correo electrónico no puede superar los 150 caracteres.');
  }

  if (!password || password.length < 6) {
    errores.push('La contraseña debe tener al menos 6 caracteres.');
  }

  if (password !== passwordConfirmacion) {
    errores.push('La confirmación no coincide con la contraseña.');
  }

  return errores;
}

async function register(req, res, next) {
  const nombre = (req.body.nombre || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();

  try {
    const errores = validarRegistro(req.body);

    if (errores.length) {
      return res.status(400).render('auth/register', {
        titulo: 'Crear cuenta',
        errores,
        valores: { nombre, email }
      });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const usuarioId = await Usuario.create({ nombre, email, passwordHash, rol: 'admin' });

    req.session.usuario = { id: usuarioId, nombre, email, rol: 'admin' };
    return res.redirect('/');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).render('auth/register', {
        titulo: 'Crear cuenta',
        errores: ['Este correo ya está registrado.'],
        valores: { nombre, email }
      });
    }
    next(error);
  }
}

function showForgotForm(req, res) {
  res.render('auth/recuperar', {
    titulo: 'Recuperar contraseña',
    enviado: false,
    error: null
  });
}

async function requestReset(req, res) {
  const email = (req.body.email || '').trim().toLowerCase();

  try {
    if (email) {
      const usuario = await Usuario.findByEmail(email);

      if (usuario) {
        await PasswordReset.deleteUnusedForUser(usuario.id);

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTOS * 60 * 1000);

        await PasswordReset.createToken(usuario.id, tokenHash, expiresAt);

        const resetUrl = `${req.protocol}://${req.get('host')}/recuperar/restablecer?token=${rawToken}`;

        try {
          await sendPasswordResetEmail(usuario.email, resetUrl);
        } catch (mailError) {
          console.error('Error al enviar correo de recuperación:', mailError.message);
        }
      }
    }
  } catch (error) {
    console.error('Error en requestReset:', error.message);
  }

  // Siempre la misma respuesta, exista o no el correo, para no revelar qué
  // cuentas existen en el sistema.
  return res.render('auth/recuperar', {
    titulo: 'Recuperar contraseña',
    enviado: true,
    error: null
  });
}

async function showResetForm(req, res) {
  const token = req.query.token || '';
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const registro = token ? await PasswordReset.findValidByHash(tokenHash) : null;

  res.render('auth/restablecer', {
    titulo: 'Restablecer contraseña',
    token,
    tokenValido: Boolean(registro),
    errores: []
  });
}

async function resetPassword(req, res, next) {
  const token = req.body.token || '';
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const registro = await PasswordReset.findValidByHash(tokenHash);

    if (!registro) {
      return res.status(400).render('auth/restablecer', {
        titulo: 'Restablecer contraseña',
        token,
        tokenValido: false,
        errores: []
      });
    }

    const passwordNueva = req.body.password_nueva || '';
    const passwordConfirmacion = req.body.password_confirmacion || '';
    const errores = [];

    if (!passwordNueva || passwordNueva.length < 6) {
      errores.push('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    if (passwordNueva !== passwordConfirmacion) {
      errores.push('La confirmación no coincide con la nueva contraseña.');
    }

    if (errores.length) {
      return res.status(400).render('auth/restablecer', {
        titulo: 'Restablecer contraseña',
        token,
        tokenValido: true,
        errores
      });
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 10);
    await Usuario.updatePassword(registro.usuario_id, passwordHash);
    await PasswordReset.markUsed(registro.id);

    req.session.flash = { type: 'success', message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
    return res.redirect('/login');
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
    }
    res.redirect('/login');
  });
}

module.exports = {
  showLogin,
  login,
  logout,
  showRegister,
  register,
  showForgotForm,
  requestReset,
  showResetForm,
  resetPassword
};
