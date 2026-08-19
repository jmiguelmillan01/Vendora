require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const pool = require('./config/database');
const { requireAuth } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const abonoRoutes = require('./routes/abonoRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const dashboardController = require('./controllers/dashboardController');
const { formatMoney, formatFecha } = require('./utils/format');
const { toSafeJsonScript } = require('./utils/safeJson');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

const unDiaEnMs = 1000 * 60 * 60 * 24;
// Sin maxAge: el propio CSS/JS de la app cambia seguido durante el
// desarrollo. Express igual envía ETag/Last-Modified, así que el navegador
// valida con el servidor en cada carga y solo re-descarga si cambió de
// verdad (una caché larga aquí causaba que los navegadores ignoraran
// archivos actualizados hasta por 24 horas).
app.use(express.static(path.join(__dirname, 'public')));
// Los archivos de Chart.js vienen de node_modules y no cambian salvo que se
// actualice la dependencia, así que sí es seguro cachearlos por más tiempo.
app.use('/vendor/chartjs', express.static(path.join(__dirname, 'node_modules/chart.js/dist'), { maxAge: unDiaEnMs * 30 }));

// MemoryStore (el store por defecto de express-session) no está pensado para
// producción: pierde todas las sesiones activas cada vez que el proceso
// reinicia y no sirve si algún día corren varias instancias. Se reutiliza el
// mismo pool de MySQL de la app (config/database.js) en vez de abrir una
// conexión aparte; la tabla `sessions` la crea y mantiene la propia librería.
const sessionStore = new MySQLStore({}, pool);
sessionStore.on('error', (error) => {
  console.error('Error en el session store de MySQL:', error.message);
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.flash = req.session.flash || null;
  res.locals.formatMoney = formatMoney;
  res.locals.formatFecha = formatFecha;
  res.locals.toSafeJsonScript = toSafeJsonScript;
  delete req.session.flash;
  next();
});

app.use('/', authRoutes);

app.get('/', requireAuth, dashboardController.index);

app.use('/clientes', requireAuth, clienteRoutes);
app.use('/productos', requireAuth, productoRoutes);
app.use('/ventas', requireAuth, ventaRoutes);
app.use('/abonos', requireAuth, abonoRoutes);
app.use('/reportes', requireAuth, reporteRoutes);
app.use('/configuracion', requireAuth, configuracionRoutes);

app.use((req, res) => {
  res.status(404).render('404', { titulo: 'Página no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { titulo: 'Error del servidor' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
