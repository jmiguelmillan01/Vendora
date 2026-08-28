const jwt = require('jsonwebtoken');

// Equivalente móvil de requireAuth (middleware/authMiddleware.js), pero para
// clientes sin cookies de navegador: en vez de redirigir a /login, responde
// 401 JSON. Inyecta req.usuarioId igual que req.session.usuario.id en la web,
// para que los controladores de la API llamen a los mismos modelos sin
// cambiar su forma de aislar por tenant.
function apiAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No autenticado. Falta el token de acceso.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = payload.id;
    req.usuario = { id: payload.id, rol: payload.rol };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

module.exports = { apiAuth };
