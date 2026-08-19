const nodemailer = require('nodemailer');

// El transporter se arma bajo demanda (no al cargar el módulo) para que la
// app siga funcionando aunque todavía no se hayan configurado las
// credenciales de Gmail en el .env; solo falla el intento de envío puntual.
function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD no están configurados en .env.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

async function sendPasswordResetEmail(to, resetUrl) {
  const ttlMinutos = process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 30;

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
    to,
    subject: 'Recupera tu contraseña - Sistema de Ventas',
    html: `
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${resetUrl}">Haz clic aquí para elegir una nueva contraseña</a></p>
      <p>Este enlace vence en ${ttlMinutos} minutos. Si tú no solicitaste esto, puedes ignorar este correo.</p>
    `
  });
}

module.exports = { sendPasswordResetEmail };
