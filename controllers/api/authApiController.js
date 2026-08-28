const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Usuario = require('../../models/Usuario');
const PasswordReset = require('../../models/PasswordReset');
const { sendPasswordResetEmail } = require('../../utils/mailer');
const { asyncHandler } = require('./_helpers');

const TOKEN_TTL_MINUTOS = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES) || 30;

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debes ingresar correo y contraseña.' });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const usuario = await Usuario.findByEmail(emailNormalizado);

  if (!usuario) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  const passwordValida = await bcrypt.compare(password, usuario.password);

  if (!passwordValida) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  const token = firmarToken(usuario);
  return res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
  });
});

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

const registro = asyncHandler(async (req, res, next) => {
  const nombre = (req.body.nombre || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const errores = validarRegistro(req.body);

  if (errores.length) {
    return res.status(400).json({ errors: errores });
  }

  try {
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const usuarioId = await Usuario.create({ nombre, email, passwordHash, rol: 'admin' });
    const usuario = { id: usuarioId, nombre, email, rol: 'admin' };
    const token = firmarToken(usuario);
    return res.status(201).json({ token, usuario });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ errors: ['Este correo ya está registrado.'] });
    }
    return next(error);
  }
});

const recuperar = asyncHandler(async (req, res) => {
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

        // El enlace del correo sigue apuntando a la web (no hay pantalla nativa
        // para esto): misma cuenta, cualquier navegador puede completar el
        // restablecimiento y el usuario vuelve a iniciar sesión en la app.
        const resetUrl = `${req.protocol}://${req.get('host')}/recuperar/restablecer?token=${rawToken}`;

        try {
          await sendPasswordResetEmail(usuario.email, resetUrl);
        } catch (mailError) {
          console.error('Error al enviar correo de recuperación:', mailError.message);
        }
      }
    }
  } catch (error) {
    console.error('Error en recuperar (API):', error.message);
  }

  // Siempre la misma respuesta, exista o no el correo, para no revelar qué
  // cuentas existen en el sistema (igual que la versión web).
  return res.json({ message: 'Si el correo existe, se envió un enlace de recuperación.' });
});

const restablecer = asyncHandler(async (req, res) => {
  const token = req.body.token || '';
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const registro = await PasswordReset.findValidByHash(tokenHash);

  if (!registro) {
    return res.status(400).json({ error: 'El enlace de recuperación no es válido o ya expiró.' });
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
    return res.status(400).json({ errors: errores });
  }

  const passwordHash = await bcrypt.hash(passwordNueva, 10);
  await Usuario.updatePassword(registro.usuario_id, passwordHash);
  await PasswordReset.markUsed(registro.id);

  return res.json({ message: 'Contraseña actualizada correctamente.' });
});

module.exports = { login, registro, recuperar, restablecer };
