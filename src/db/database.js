const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/inventario.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

// Asegurar claves foráneas y WAL para rendimiento óptimo
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initDatabase() {
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

// Inicializar esquema si no existen tablas
try {
  const check = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='materiales'").get();
  if (!check) {
    initDatabase();
  }
} catch (e) {
  initDatabase();
}

module.exports = {
  db,
  initDatabase,
  query: (sql, params = []) => db.prepare(sql).all(...params),
  get: (sql, params = []) => db.prepare(sql).get(...params),
  run: (sql, params = []) => db.prepare(sql).run(...params)
};
