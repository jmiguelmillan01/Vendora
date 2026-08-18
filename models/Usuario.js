const pool = require('../config/database');

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ? AND activo = 1 LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ? AND activo = 1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function findByIdConPassword(id) {
  const [rows] = await pool.query(
    'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE id = ? AND activo = 1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, id]);
}

module.exports = { findByEmail, findById, findByIdConPassword, updatePassword };
