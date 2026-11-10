require('dotenv').config();
const fs=require('node:fs'),path=require('node:path'),db=require('./db');
const root=path.join(__dirname,'..','data','sources'),threshold=Number(process.env.ALERT_THRESHOLD_PERCENT||5),now=new Date().toISOString();
const products=[['MAT-CEM-GRIS-50KG','Cemento gris 50 kg','Materiales de construcción','saco'],['MAT-VAR-3-G40-6M','Varilla #3 grado 40, 6 m','Materiales de construcción','unidad'],['MAT-BLK-12-20-40','Block 12 x 20 x 40 cm','Materiales de construcción','unidad'],['MAT-ARENA-M3','Arena','Materiales de construcción','m3']];
let sourceFailures=0;
const seed=db.prepare('INSERT OR IGNORE INTO products(code,name,category,unit) VALUES(?,?,?,?)');products.forEach(x=>seed.run(...x));
for(const filename of ['novex.json','construplaza.json']){let supplierName=filename;try{
 const parsed=JSON.parse(fs.readFileSync(path.join(root,filename),'utf8'));supplierName=parsed.supplier;if(!supplierName||!Array.isArray(parsed.products))throw Error('Estructura inválida: se esperan supplier y products[]');
 db.prepare('INSERT INTO suppliers(name,source_file) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET source_file=excluded.source_file').run(supplierName,filename);const sid=db.prepare('SELECT id FROM suppliers WHERE name=?').get(supplierName).id;
 db.exec('BEGIN IMMEDIATE');try{for(const x of parsed.products){if(!x.supplierSku||!x.productCode||!x.name||!Number.isFinite(x.price)||x.price<0)throw Error(`Registro inválido: ${JSON.stringify(x)}`);
 db.prepare(`INSERT INTO product_equivalences(product_id,supplier_id,supplier_sku,supplier_name,source_url) SELECT id,?,?,?,? FROM products WHERE code=? ON CONFLICT(supplier_id,supplier_sku) DO UPDATE SET product_id=excluded.product_id,supplier_name=excluded.supplier_name,source_url=excluded.source_url`).run(sid,x.supplierSku,x.name,x.url||'',x.productCode);
 const eq=db.prepare('SELECT id FROM product_equivalences WHERE supplier_id=? AND supplier_sku=?').get(sid,x.supplierSku);if(!eq)throw Error(`Código interno desconocido: ${x.productCode}`);
 const prev=db.prepare('SELECT price FROM price_captures WHERE equivalence_id=? ORDER BY captured_at DESC,id DESC LIMIT 1').get(eq.id);
 db.prepare('INSERT INTO price_captures(equivalence_id,price,currency,captured_at,source_payload) VALUES(?,?,?,?,?)').run(eq.id,x.price,x.currency||'CRC',now,JSON.stringify(x));
 if(prev&&prev.price!==0){const delta=(x.price-prev.price)/prev.price*100;if(Math.abs(delta)>=threshold)db.prepare('INSERT INTO price_alerts(equivalence_id,previous_price,current_price,change_percent,threshold_percent,created_at) VALUES(?,?,?,?,?,?)').run(eq.id,prev.price,x.price,Number(delta.toFixed(2)),threshold,now);}
 }db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}db.prepare('UPDATE source_errors SET resolved_at=? WHERE source_file=? AND resolved_at IS NULL').run(now,filename);console.log(`OK ${supplierName}: ${parsed.products.length} precios capturados`);
 }catch(e){sourceFailures++;db.prepare('INSERT INTO source_errors(supplier_name,source_file,message,created_at) VALUES(?,?,?,?)').run(supplierName,filename,String(e.message),now);console.error(`ERROR ${supplierName}: ${e.message}`);}}
if(sourceFailures)process.exitCode=1;
