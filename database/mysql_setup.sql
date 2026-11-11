-- Comparador de precios | MySQL 8.0+
-- Ejecutar este archivo completo en MySQL Workbench conectado como administrador.

CREATE DATABASE IF NOT EXISTS comparador_precios
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE comparador_precios;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(120) NOT NULL,
  unit VARCHAR(32) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suppliers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  source_file VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_suppliers_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_equivalences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  supplier_id BIGINT UNSIGNED NOT NULL,
  supplier_sku VARCHAR(100) NOT NULL,
  supplier_name VARCHAR(180) NOT NULL,
  source_url VARCHAR(500) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_supplier_sku (supplier_id, supplier_sku),
  KEY ix_equivalence_product (product_id),
  CONSTRAINT fk_equivalence_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_equivalence_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS price_captures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  equivalence_id BIGINT UNSIGNED NOT NULL,
  price DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'CRC',
  captured_at DATETIME(3) NOT NULL,
  source_payload JSON NOT NULL,
  PRIMARY KEY (id),
  KEY ix_capture_latest (equivalence_id, captured_at, id),
  CONSTRAINT fk_capture_equivalence FOREIGN KEY (equivalence_id) REFERENCES product_equivalences(id),
  CONSTRAINT chk_capture_price CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS price_alerts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  equivalence_id BIGINT UNSIGNED NOT NULL,
  previous_price DECIMAL(14,2) NOT NULL,
  current_price DECIMAL(14,2) NOT NULL,
  change_percent DECIMAL(9,2) NOT NULL,
  threshold_percent DECIMAL(9,2) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_alert_recent (created_at),
  CONSTRAINT fk_alert_equivalence FOREIGN KEY (equivalence_id) REFERENCES product_equivalences(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS source_errors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_name VARCHAR(120) NOT NULL,
  source_file VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  resolved_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY ix_source_error_open (resolved_at, created_at)
) ENGINE=InnoDB;

INSERT IGNORE INTO products (code, name, category, unit) VALUES
  ('MAT-CEM-GRIS-50KG', 'Cemento gris 50 kg', 'Materiales de construcción', 'saco'),
  ('MAT-VAR-3-G40-6M', 'Varilla #3 grado 40, 6 m', 'Materiales de construcción', 'unidad'),
  ('MAT-BLK-12-20-40', 'Block 12 x 20 x 40 cm', 'Materiales de construcción', 'unidad'),
  ('MAT-ARENA-M3', 'Arena', 'Materiales de construcción', 'm3')
;

INSERT IGNORE INTO suppliers (name, source_file) VALUES
  ('Novex (simulado)', 'novex.json'),
  ('Construplaza (simulado)', 'construplaza.json')
;

-- Los equivalentes y precios se cargan desde los dos JSON al pulsar "Actualizar precios".
