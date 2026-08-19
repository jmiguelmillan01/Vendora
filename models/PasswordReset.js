const pool = require('../config/database');

async function createToken(usuarioId, tokenHash, expiresAt) {
  await pool.query(
    'INSERT INTO password_resets (usuario_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [usuarioId, tokenHash, expiresAt]
  );
}

async function findValidByHash(tokenHash) {
  const [rows] = await pool.query(
    `SELECT id, usuario_id, expires_at, used_at
     FROM password_resets
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function markUsed(id) {
  await pool.query('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [id]);
}

async function deleteUnusedForUser(usuarioId) {
  await pool.query('DELETE FROM password_resets WHERE usuario_id = ? AND used_at IS NULL', [usuarioId]);
}

module.exports = { createToken, findValidByHash, markUsed, deleteUnusedForUser };
