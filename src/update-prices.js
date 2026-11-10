require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');

const sourceDirectory = path.join(__dirname, '..', 'data', 'sources');
const sourceFiles = ['novex.json', 'construplaza.json'];
const configuredThreshold = Number(process.env.ALERT_THRESHOLD_PERCENT || 5);
const threshold = Number.isFinite(configuredThreshold) && configuredThreshold >= 0 ? configuredThreshold : 5;
const capturedAt = new Date().toISOString().slice(0, 23).replace('T', ' ');
const products = [
  ['MAT-CEM-GRIS-50KG', 'Cemento gris 50 kg', 'Materiales de construcción', 'saco'],
  ['MAT-VAR-3-G40-6M', 'Varilla #3 grado 40, 6 m', 'Materiales de construcción', 'unidad'],
  ['MAT-BLK-12-20-40', 'Block 12 x 20 x 40 cm', 'Materiales de construcción', 'unidad'],
  ['MAT-ARENA-M3', 'Arena', 'Materiales de construcción', 'm3']
];

async function updateSource(filename) {
  let supplierName = filename;
  try {
    const sourcePath = path.join(sourceDirectory, filename);
    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    supplierName = source.supplier || filename;
    if (!source.supplier || !Array.isArray(source.products)) {
      throw new Error('Estructura inválida: se esperan supplier y products[].');
    }

    await db.query(
      'INSERT INTO suppliers (name, source_file) VALUES (?, ?) ON DUPLICATE KEY UPDATE source_file = VALUES(source_file)',
      [supplierName, filename]
    );
    const [supplier] = await db.query('SELECT id FROM suppliers WHERE name = ?', [supplierName]);
    if (!supplier) throw new Error(`No se encontró el proveedor ${supplierName} en MySQL.`);

    await db.transaction(async (connection) => {
      for (const item of source.products) {
        if (!item.supplierSku || !item.productCode || !item.name || !Number.isFinite(item.price) || item.price < 0) {
          throw new Error(`Registro de precio inválido: ${JSON.stringify(item)}`);
        }

        const [productRows] = await connection.execute('SELECT id FROM products WHERE code = ?', [item.productCode]);
        const product = productRows[0];
        if (!product) throw new Error(`Código interno desconocido: ${item.productCode}`);

        await connection.execute(
          `INSERT INTO product_equivalences (product_id, supplier_id, supplier_sku, supplier_name, source_url)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE product_id = VALUES(product_id), supplier_name = VALUES(supplier_name), source_url = VALUES(source_url)`,
          [product.id, supplier.id, item.supplierSku, item.name, item.url || null]
        );
        const [equivalenceRows] = await connection.execute(
          'SELECT id FROM product_equivalences WHERE supplier_id = ? AND supplier_sku = ?',
          [supplier.id, item.supplierSku]
        );
        const equivalence = equivalenceRows[0];
        if (!equivalence) throw new Error(`No se pudo guardar la equivalencia del artículo ${item.supplierSku}.`);
        const [previousRows] = await connection.execute(
          'SELECT price FROM price_captures WHERE equivalence_id = ? ORDER BY captured_at DESC, id DESC LIMIT 1',
          [equivalence.id]
        );
        const previous = previousRows[0];

        await connection.execute(
          'INSERT INTO price_captures (equivalence_id, price, currency, captured_at, source_payload) VALUES (?, ?, ?, ?, ?)',
          [equivalence.id, item.price, item.currency || 'CRC', capturedAt, JSON.stringify(item)]
        );

        if (previous && Number(previous.price) !== 0) {
          const changePercent = ((item.price - Number(previous.price)) / Number(previous.price)) * 100;
          if (Math.abs(changePercent) >= threshold) {
            await connection.execute(
              `INSERT INTO price_alerts (equivalence_id, previous_price, current_price, change_percent, threshold_percent, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [equivalence.id, previous.price, item.price, Number(changePercent.toFixed(2)), threshold, capturedAt]
            );
          }
        }
      }
    });

    await db.query(
      'UPDATE source_errors SET resolved_at = ? WHERE source_file = ? AND resolved_at IS NULL',
      [capturedAt, filename]
    );
    console.log(`OK ${supplierName}: ${source.products.length} precios guardados en MySQL.`);
    return true;
  } catch (error) {
    await db.query(
      'INSERT INTO source_errors (supplier_name, source_file, message, created_at) VALUES (?, ?, ?, ?)',
      [supplierName, filename, String(error.message), capturedAt]
    );
    console.error(`ERROR ${supplierName}: ${error.message}`);
    return false;
  }
}

async function main() {
  let failedSources = 0;
  try {
    for (const product of products) {
      await db.query(
        `INSERT INTO products (code, name, category, unit) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), unit = VALUES(unit)`,
        product
      );
    }
    for (const filename of sourceFiles) {
      if (!(await updateSource(filename))) failedSources += 1;
    }
  } catch (error) {
    console.error(`No se pudo conectar o preparar la base de datos MySQL: ${error.message}`);
    failedSources = Math.max(failedSources, 1);
  } finally {
    await db.pool.end();
  }
  if (failedSources) process.exitCode = 1;
}

main();
