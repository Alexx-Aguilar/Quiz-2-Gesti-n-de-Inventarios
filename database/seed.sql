-- Datos semilla oficiales: Constructora Del Valle S.A.
-- Quiz #2 - Gestión de Inventarios

-- 1. Categorías normalizadas (Taxonomía de 2 niveles)
INSERT INTO categorias (id, codigo, categoria_padre, subcategoria, descripcion) VALUES
(1, 'MAT-AGR', 'Materiales de Construcción', 'Cemento y Agregados', 'Cemento gris, arena, piedra y mezclas'),
(2, 'MAT-ACE', 'Materiales de Construcción', 'Acero y Estructuras', 'Varilla corrugada, mallas, perfiles y alambres'),
(3, 'MAT-MAM', 'Materiales de Construcción', 'Mampostería y Prefabricados', 'Blocks de concreto, adoquines, ladrillos'),
(4, 'SEG-EPP', 'Seguridad y Salud Ocupacional', 'Equipo de Protección Personal', 'Guantes, cascos, chalecos, lentes'),
(5, 'HID-TUB', 'Instalaciones Hidráulicas', 'Tuberías y Accesorios PVC', 'Tubos PVC, codos, uniones y pegamento');

-- 2. Materiales estandarizados con parámetros de inventario
INSERT INTO materiales (id, codigo_estandar, nombre, categoria_id, unidad_medida, demanda_promedio_diaria, demanda_maxima_diaria, tiempo_entrega_dias, stock_minimo, stock_maximo, precio_referencia) VALUES
(1, 'MAT-CEM-50', 'Cemento gris 50 kg', 1, 'sacos', 40.0, 55.0, 3, 45.0, 400.0, 6300.0),
(2, 'MAT-VAR-38', 'Varilla #3 grado 40 (3/8" x 6 m)', 2, 'unidades', 120.0, 160.0, 5, 200.0, 2000.0, 2050.0),
(3, 'MAT-BLO-12', 'Block de concreto 12 x 20 x 40', 3, 'unidades', 600.0, 900.0, 4, 1200.0, 7000.0, 520.0),
(4, 'MAT-ARE-M3', 'Arena para construcción (m3)', 1, 'm3', 6.0, 10.0, 2, 8.0, 60.0, 14500.0),
(5, 'SEG-GUA-NIT', 'Guantes de nitrilo talla L', 4, 'pares', 5.0, 8.0, 2, 10.0, 250.0, 850.0),
(6, 'HID-TUB-12', 'Tubo PVC 1/2 SDR 13.5', 5, 'tubos', 2.0, 4.0, 3, 6.0, 120.0, 2900.0);

-- 3. Bodegas y Ubicaciones
INSERT INTO bodegas_obras (id, codigo, nombre, tipo, ubicacion) VALUES
(1, 'BOD-CENTRAL', 'Bodega Central', 'BODEGA_CENTRAL', 'San José, La Uruca'),
(2, 'OBRA-NUBES', 'Obra Condominio Las Nubes', 'OBRA', 'Escazú'),
(3, 'TAL-MANT', 'Taller de Mantenimiento', 'TALLER_MANTENIMIENTO', 'San José, Pavas');

-- 4. Proveedores
INSERT INTO proveedores (id, codigo, nombre, contacto, telefono, correo, condiciones_pago, calificacion_ponderada) VALUES
(1, 'PRV-001', 'Proveedor A (Distribuidora El Porvenir)', 'Carlos Mora', '2222-1111', 'ventas@proveedora.cr', '30 días crédito', 4.35),
(2, 'PRV-002', 'Proveedor B (Ferretería Industrial Santa Ana)', 'Luisa Gómez', '2222-2222', 'contacto@proveedorb.cr', 'Contado', 3.40),
(3, 'PRV-003', 'Proveedor C (Aceros y Perfiles del Valle)', 'Roberto Ruiz', '2222-3333', 'pedidos@proveedorc.cr', '15 días crédito', 3.85),
(4, 'PRV-004', 'Proveedor D (Depósito de Metales El Pacífico)', 'Mario Vargas', '2222-4444', 'mvargas@proveedord.cr', 'Contado', 3.10),
(5, 'PRV-005', 'Proveedor E (Suministros de Protección EPP)', 'Ana Brenes', '2222-5555', 'ventas@proveedore.cr', '30 días crédito', 4.10),
(6, 'PRV-006', 'Proveedor F (Seguridad y Ropa de Trabajo F)', 'Jorge Castro', '2222-6666', 'jcastro@proveedorf.cr', 'Contado', 3.30);

-- 5. Contratos vigentes (Precios contractuales negociados)
INSERT INTO contratos (id, proveedor_id, material_id, precio_pactado, fecha_inicio, fecha_fin, estado) VALUES
(1, 1, 1, 6300.0, '2026-01-01', '2026-12-31', 'ACTIVO'), -- Proveedor A: Cemento gris 50 kg a ₡6 300
(2, 1, 2, 2050.0, '2026-01-01', '2026-12-31', 'ACTIVO'); -- Proveedor A: Varilla #3 a ₡2 050

-- 6. Movimientos de Inventario Iniciales
-- Configurados con exactitud para coincidir con los stocks del Ejercicio A5:
-- Cemento: 190 sacos | Varilla: 850 unid | Block: 2 800 unid | Arena: 14 m3 | Guantes: 180 pares | Tubo PVC: 25 tubos
INSERT INTO movimientos_inventario (material_id, bodega_id, bodega_destino_id, tipo_movimiento, cantidad, fecha, usuario, documento_origen_tipo, documento_origen_numero, motivo) VALUES
-- Cemento (Total neto = 190)
(1, 1, NULL, 'ENTRADA', 300.0, '2026-10-15 09:00:00', 'bodeguero_central', 'ORDEN_COMPRA', 'OC-1061', 'Recepción de OC-1061 según contrato'),
(1, 1, NULL, 'SALIDA', 110.0, '2026-10-16 14:00:00', 'bodeguero_central', 'VALE_SALIDA', 'VALE-1055', 'Consumo en fundaciones Obra Las Nubes'),
-- Varilla #3 (Total neto = 850)
(2, 1, NULL, 'ENTRADA', 1000.0, '2026-10-10 08:30:00', 'bodeguero_central', 'ORDEN_COMPRA', 'OC-1030', 'Recepción pedido de varilla bodega'),
(2, 1, NULL, 'SALIDA', 150.0, '2026-10-12 11:00:00', 'encargado_obra', 'VALE_SALIDA', 'VALE-1044', 'Consumo fundaciones fase 1'),
-- Block 12x20x40 (Total neto = 2800)
(3, 1, NULL, 'ENTRADA', 5000.0, '2026-10-01 07:00:00', 'bodeguero_central', 'SALDO_INICIAL', 'INV-INI-2026', 'Inventario inicial octubre'),
(3, 1, NULL, 'SALIDA', 2200.0, '2026-10-20 16:30:00', 'encargado_obra', 'VALE_SALIDA', 'VALE-1090', 'Levantamiento de muros perimetrales'),
-- Arena (m3) (Total neto = 14)
(4, 1, NULL, 'ENTRADA', 30.0, '2026-10-05 10:00:00', 'bodeguero_central', 'SALDO_INICIAL', 'INV-INI-2026', 'Carga inicial en tolva'),
(4, 1, NULL, 'SALIDA', 16.0, '2026-10-22 15:00:00', 'encargado_obra', 'VALE_SALIDA', 'VALE-1102', 'Vaciado de losas'),
-- Guantes de nitrilo L (Total neto = 180)
(5, 1, NULL, 'ENTRADA', 200.0, '2026-10-01 08:00:00', 'bodeguero_central', 'SALDO_INICIAL', 'INV-INI-2026', 'Dotación mensual EPP'),
(5, 1, NULL, 'SALIDA', 20.0, '2026-10-08 09:00:00', 'bodeguero_central', 'VALE_SALIDA', 'VALE-1022', 'Entrega a cuadrilla albañilería'),
-- Tubo PVC 1/2 (Total neto = 25)
(6, 1, NULL, 'ENTRADA', 40.0, '2026-10-02 08:00:00', 'bodeguero_central', 'SALDO_INICIAL', 'INV-INI-2026', 'Stock inicial plomería'),
(6, 1, NULL, 'SALIDA', 15.0, '2026-10-18 10:00:00', 'bodeguero_central', 'VALE_SALIDA', 'VALE-1077', 'Instalación provisional agua potable');

-- 7. Órdenes de Compra del Mes de Octubre (Caso A3 y Matriz de Aprobación A1)
INSERT INTO ordenes_compra (id, numero_oc, fecha, area_solicitante, proveedor_id, estado, total, rol_aprobador_requerido, cotizaciones_requeridas, aprobado_por, fecha_aprobacion, es_posible_duplicado, motivo_duplicado) VALUES
(1, 'OC-1041', '2026-10-02', 'Obras', 1, 'APROBADA', 1290000.0, 'Jefatura de Compras', 2, 'jefe_compras', '2026-10-02 10:00:00', 1, 'Coincide en fecha (02/10), proveedor (Prov A), artículo y cantidad (200 sacos) con OC-1042'),
(2, 'OC-1042', '2026-10-02', 'Obras', 1, 'APROBADA', 1290000.0, 'Jefatura de Compras', 2, 'jefe_compras', '2026-10-02 10:30:00', 1, 'Coincide en fecha (02/10), proveedor (Prov A), artículo y cantidad (200 sacos) con OC-1041'),
(3, 'OC-1047', '2026-10-06', 'Mantenimiento', 2, 'APROBADA', 284000.0, 'Jefatura de Compras', 2, 'jefe_compras', '2026-10-06 11:00:00', 0, NULL),
(4, 'OC-1050', '2026-10-08', 'Obras', 3, 'APROBADA', 1075000.0, 'Jefatura de Compras', 2, 'jefe_compras', '2026-10-08 14:00:00', 1, 'Alerta de posible fraccionamiento con OC-1053 (diferencia de 1 día, mismo proveedor Prov C, cantidades similares 500 vs 480)'),
(5, 'OC-1053', '2026-10-09', 'Obras', 3, 'APROBADA', 1032000.0, 'Jefatura de Compras', 2, 'jefe_compras', '2026-10-09 09:15:00', 1, 'Alerta de posible fraccionamiento con OC-1050 (diferencia de 1 día, mismo proveedor Prov C, cantidades similares 480 vs 500)'),
(6, 'OC-1058', '2026-10-13', 'Mantenimiento', 4, 'APROBADA', 156000.0, 'Jefatura del área solicitante', 1, 'jefe_mantenimiento', '2026-10-13 16:00:00', 0, NULL),
(7, 'OC-1061', '2026-10-15', 'Bodega Central', 1, 'RECIBIDA', 1890000.0, 'Jefatura de Compras', 2, 'jefe_compras', '2026-10-15 08:30:00', 0, NULL);

-- 8. Detalle de las Órdenes de Compra (Cálculo de sobreprecio vs contrato vigente)
INSERT INTO ordenes_compra_detalle (orden_compra_id, material_id, cantidad, precio_unitario, subtotal, precio_contratado_referencia, sobreprecio_unitario) VALUES
-- OC-1041: 200 sacos cemento a ₡6 450 (Contrato Prov A: ₡6 300 => Sobreprecio ₡150)
(1, 1, 200.0, 6450.0, 1290000.0, 6300.0, 150.0),
-- OC-1042: 200 sacos cemento a ₡6 450 (Contrato Prov A: ₡6 300 => Sobreprecio ₡150)
(2, 1, 200.0, 6450.0, 1290000.0, 6300.0, 150.0),
-- OC-1047: 40 sacos cemento a ₡7 100 con Prov B (Contrato Prov A: ₡6 300 => Sobreprecio ₡800)
(3, 1, 40.0, 7100.0, 284000.0, 6300.0, 800.0),
-- OC-1050: 500 varillas #3 a ₡2 150 con Prov C (Contrato Prov A: ₡2 050 => Sobreprecio ₡100)
(4, 2, 500.0, 2150.0, 1075000.0, 2050.0, 100.0),
-- OC-1053: 480 varillas #3 a ₡2 150 con Prov C (Contrato Prov A: ₡2 050 => Sobreprecio ₡100)
(5, 2, 480.0, 2150.0, 1032000.0, 2050.0, 100.0),
-- OC-1058: 60 varillas #3 a ₡2 600 con Prov D (Contrato Prov A: ₡2 050 => Sobreprecio ₡550)
(6, 2, 60.0, 2600.0, 156000.0, 2050.0, 550.0),
-- OC-1061: 300 sacos cemento a ₡6 300 con Prov A (Contrato: ₡6 300 => Sobreprecio ₡0)
(7, 1, 300.0, 6300.0, 1890000.0, 6300.0, 0.0);
