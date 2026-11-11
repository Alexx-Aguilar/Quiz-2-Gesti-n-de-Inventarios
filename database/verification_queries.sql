USE comparador_precios;

-- 1. Catálogo normalizado
SELECT code, name, category, unit
FROM products
ORDER BY code;

-- 2. Equivalencias entre códigos internos y proveedores
SELECT p.code, p.name AS producto, s.name AS proveedor, e.supplier_sku, e.supplier_name
FROM product_equivalences e
JOIN products p ON p.id = e.product_id
JOIN suppliers s ON s.id = e.supplier_id
ORDER BY p.code, s.name;

-- 3. Capturas históricas (no se sobrescriben)
SELECT p.code, p.name AS producto, s.name AS proveedor, c.price, c.currency, c.captured_at
FROM price_captures c
JOIN product_equivalences e ON e.id = c.equivalence_id
JOIN products p ON p.id = e.product_id
JOIN suppliers s ON s.id = e.supplier_id
ORDER BY c.captured_at DESC, c.id DESC;

-- 4. Alertas generadas al cambiar un precio por encima del umbral
SELECT p.code, p.name AS producto, s.name AS proveedor,
       a.previous_price, a.current_price, a.change_percent, a.threshold_percent, a.created_at
FROM price_alerts a
JOIN product_equivalences e ON e.id = a.equivalence_id
JOIN products p ON p.id = e.product_id
JOIN suppliers s ON s.id = e.supplier_id
ORDER BY a.created_at DESC, a.id DESC;
