require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const sqlPath = path.join(__dirname, 'database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    console.log('Ejecutando database/database.sql ...');
    await connection.query(sql);
    console.log('Base de datos y tablas creadas correctamente.');
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Error al inicializar la base de datos:', err.message);
  process.exit(1);
});
