PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS suppliers(id INTEGER PRIMARY KEY,name TEXT NOT NULL UNIQUE,source_file TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY,code TEXT NOT NULL UNIQUE,name TEXT NOT NULL,category TEXT NOT NULL,unit TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS product_equivalences(id INTEGER PRIMARY KEY,product_id INTEGER NOT NULL REFERENCES products(id),supplier_id INTEGER NOT NULL REFERENCES suppliers(id),supplier_sku TEXT NOT NULL,supplier_name TEXT NOT NULL,source_url TEXT,UNIQUE(supplier_id,supplier_sku));
CREATE TABLE IF NOT EXISTS price_captures(id INTEGER PRIMARY KEY,equivalence_id INTEGER NOT NULL REFERENCES product_equivalences(id),price REAL NOT NULL CHECK(price>=0),currency TEXT NOT NULL,captured_at TEXT NOT NULL,source_payload TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_capture_latest ON price_captures(equivalence_id,captured_at DESC);
CREATE TABLE IF NOT EXISTS price_alerts(id INTEGER PRIMARY KEY,equivalence_id INTEGER NOT NULL REFERENCES product_equivalences(id),previous_price REAL NOT NULL,current_price REAL NOT NULL,change_percent REAL NOT NULL,threshold_percent REAL NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS source_errors(id INTEGER PRIMARY KEY,supplier_name TEXT NOT NULL,source_file TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL);
