// Los controladores web atrapan errores async con try/catch y llaman a
// next(error) manualmente en cada handler. Para la API se envuelve una sola
// vez: cualquier rechazo de la promesa cae en next(error), que termina en el
// manejador de errores JSON de routes/api/index.js.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
