const fs = require('fs');
const path = require('path');
const { db } = require('./database');

function runSeed() {
  console.log('--- Iniciando siembra de datos para Constructora Del Valle S.A. ---');
  
  // Limpiar tablas existentes en orden de dependencia
  const tables = [
    'alertas_reorden',
    'movimientos_inventario',
    'ordenes_compra_detalle',
    'ordenes_compra',
    'contratos',
    'proveedores',
    'bodegas_obras',
    'materiales',
    'categorias'
  ];

  db.exec('PRAGMA foreign_keys = OFF;');
  for (const table of tables) {
    db.exec(`DROP TABLE IF EXISTS ${table};`);
  }
  db.exec('PRAGMA foreign_keys = ON;');

  // Ejecutar Schema
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  console.log('✓ Tablas creadas correctamente');

  // Ejecutar Seed
  const seedPath = path.join(__dirname, '../../database/seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  db.exec(seedSql);
  console.log('✓ Datos semilla insertados correctamente');

  console.log('--- Siembra completada con éxito ---');
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
