require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
  const nombreBase = process.env.DB_NAME;
  if (!nombreBase) {
    throw new Error('DB_NAME no está definido en el .env.');
  }

  const sqlPath = path.join(__dirname, 'database.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conexionBase = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  };

  // 1) Crear la base indicada en DB_NAME si todavía no existe (sin
  //    seleccionar ninguna base en la conexión, ya que puede no existir aún).
  const conexionInicial = await mysql.createConnection(conexionBase);
  try {
    console.log(`Creando la base de datos "${nombreBase}" si no existe...`);
    await conexionInicial.query(
      `CREATE DATABASE IF NOT EXISTS \`${nombreBase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await conexionInicial.end();
  }

  // 2) Reconectar ya posicionado dentro de esa base y crear las tablas.
  const conexion = await mysql.createConnection({ ...conexionBase, database: nombreBase });
  try {
    console.log('Ejecutando database/database.sql ...');
    await conexion.query(sql);
    console.log('Base de datos y tablas creadas correctamente.');
  } finally {
    await conexion.end();
  }
}

main().catch((err) => {
  console.error('Error al inicializar la base de datos:', err.message);
  process.exit(1);
});
