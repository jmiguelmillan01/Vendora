require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const { requireAuth } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const { formatMoney, formatFecha } = require('./utils/format');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.flash = req.session.flash || null;
  res.locals.formatMoney = formatMoney;
  res.locals.formatFecha = formatFecha;
  delete req.session.flash;
  next();
});

app.use('/', authRoutes);

app.get('/', requireAuth, (req, res) => {
  res.render('index', { titulo: 'Inicio', activeNav: 'inicio' });
});

app.use('/clientes', requireAuth, clienteRoutes);
app.use('/productos', requireAuth, productoRoutes);
app.use('/ventas', requireAuth, ventaRoutes);

app.use((req, res) => {
  res.status(404).render('404', { titulo: 'Página no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { titulo: 'Error del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
