require('dotenv').config();
const express = require('express');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const db = require('./db');

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDirectory = path.join(__dirname, '..', 'public');
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

app.use(express.json());
app.use(express.static(publicDirectory));

app.get('/api/config', (req, res) => {
  const configured = Number(process.env.ALERT_THRESHOLD_PERCENT || 5);
  res.json({ thresholdPercent: Number.isFinite(configured) && configured >= 0 ? configured : 5 });
});

app.get('/api/products', asyncRoute(async (req, res) => {
  res.json(await db.query('SELECT id, code, name, category, unit FROM products ORDER BY name'));
}));

app.get('/api/products/:code/compare', asyncRoute(async (req, res) => {
  const rows = await db.query(
    `SELECT p.code, p.name AS product, s.name AS supplier, e.supplier_sku,
            e.supplier_name, e.source_url, c.price, c.currency, c.captured_at
     FROM products p
     JOIN product_equivalences e ON e.product_id = p.id
     JOIN suppliers s ON s.id = e.supplier_id
     JOIN price_captures c ON c.id = (
       SELECT latest.id FROM price_captures latest
       WHERE latest.equivalence_id = e.id
       ORDER BY latest.captured_at DESC, latest.id DESC LIMIT 1
     )
     WHERE p.code = ?
     ORDER BY c.price ASC, s.name ASC`,
    [req.params.code]
  );
  if (!rows.length) return res.status(404).json({ error: 'Producto sin capturas vigentes.' });
  res.json({ code: rows[0].code, product: rows[0].product, offers: rows });
}));

app.get('/api/products/:code/history', asyncRoute(async (req, res) => {
  res.json(await db.query(
    `SELECT c.captured_at, c.price, c.currency, s.name AS supplier, e.supplier_sku
     FROM price_captures c
     JOIN product_equivalences e ON e.id = c.equivalence_id
     JOIN suppliers s ON s.id = e.supplier_id
     JOIN products p ON p.id = e.product_id
     WHERE p.code = ?
     ORDER BY c.captured_at DESC, c.id DESC LIMIT 200`,
    [req.params.code]
  ));
}));

app.get('/api/alerts', asyncRoute(async (req, res) => {
  res.json(await db.query(
    `SELECT a.id, a.previous_price, a.current_price, a.change_percent, a.threshold_percent,
            a.created_at, p.code, p.name AS product, e.supplier_name, s.name AS supplier
     FROM price_alerts a
     JOIN product_equivalences e ON e.id = a.equivalence_id
     JOIN suppliers s ON s.id = e.supplier_id
     JOIN products p ON p.id = e.product_id
     ORDER BY a.created_at DESC, a.id DESC LIMIT 100`
  ));
}));

app.get('/api/errors', asyncRoute(async (req, res) => {
  res.json(await db.query(
    'SELECT id, supplier_name, source_file, message, created_at FROM source_errors WHERE resolved_at IS NULL ORDER BY created_at DESC LIMIT 100'
  ));
}));

app.post('/api/update', (req, res) => {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'update-prices.js')], {
    cwd: path.join(__dirname, '..'), encoding: 'utf8', env: process.env, timeout: 120000
  });
  const failed = Boolean(result.error) || result.status !== 0;
  res.status(failed ? 502 : 200).json({
    stdout: result.stdout || '', stderr: result.stderr || '', status: result.status,
    error: result.error?.message || (failed ? 'Una o más fuentes no pudieron actualizarse. Revisa el estado de fuentes.' : null)
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Ocurrió un error al consultar el servicio. Revisa la conexión de MySQL.' });
});

async function start() {
  try {
    await db.query('SELECT 1 AS mysql_ready');
    app.listen(port, () => console.log(`Comparador conectado a MySQL en http://localhost:${port}`));
  } catch (error) {
    console.error(`No se pudo conectar a MySQL: ${error.message}`);
    console.error('Revisa MySQL Server, la base comparador_precios y las variables del archivo .env.');
    process.exitCode = 1;
    await db.pool.end();
  }
}

if (require.main === module) start();
module.exports = { app, start };
