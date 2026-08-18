const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

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

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
    }
    res.redirect('/login');
  });
}

module.exports = { showLogin, login, logout };
