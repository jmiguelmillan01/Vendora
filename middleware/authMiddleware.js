function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.redirect('/login');
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.usuario) {
    return res.redirect('/');
  }
  return next();
}

module.exports = { requireAuth, redirectIfAuthenticated };
