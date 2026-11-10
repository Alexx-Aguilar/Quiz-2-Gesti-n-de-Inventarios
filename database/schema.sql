-- Esquema SQL: Sistema de Gestión de Inventarios y Compras
-- Constructora Del Valle S.A.
-- Base de datos: SQLite

PRAGMA foreign_keys = ON;

-- 1. Categorías de Gasto (Taxonomía de 2 niveles)
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    categoria_padre TEXT NOT NULL,
    subcategoria TEXT NOT NULL,
    descripcion TEXT
);

-- 2. Catálogo de Materiales Normalizados
CREATE TABLE IF NOT EXISTS materiales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_estandar TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    categoria_id INTEGER NOT NULL,
    unidad_medida TEXT NOT NULL,
    demanda_promedio_diaria REAL NOT NULL DEFAULT 0,
    demanda_maxima_diaria REAL NOT NULL DEFAULT 0,
    tiempo_entrega_dias INTEGER NOT NULL DEFAULT 1,
    stock_minimo REAL DEFAULT 0,
    stock_maximo REAL DEFAULT 0,
    precio_referencia REAL DEFAULT 0,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- 3. Bodegas y Ubicaciones de Obra
CREATE TABLE IF NOT EXISTS bodegas_obras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('BODEGA_CENTRAL', 'OBRA', 'TALLER_MANTENIMIENTO')),
    ubicacion TEXT
);

-- 4. Directorio de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    correo TEXT,
    condiciones_pago TEXT DEFAULT 'Contado',
    calificacion_ponderada REAL DEFAULT 0
);

-- 5. Contratos Marco y Precios Negociados
CREATE TABLE IF NOT EXISTS contratos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proveedor_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    precio_pactado REAL NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado TEXT DEFAULT 'ACTIVO' CHECK(estado IN ('ACTIVO', 'VENCIDO', 'CANCELADO')),
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id),
    FOREIGN KEY (material_id) REFERENCES materiales(id)
);

-- 6. Órdenes de Compra (con Matriz de Aprobación y Anti-Fraccionamiento)
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_oc TEXT UNIQUE NOT NULL,
    fecha DATE NOT NULL,
    area_solicitante TEXT NOT NULL CHECK(area_solicitante IN ('Obras', 'Mantenimiento', 'Bodega Central')),
    proveedor_id INTEGER NOT NULL,
    estado TEXT NOT NULL DEFAULT 'PENDIENTE_APROBACION' CHECK(estado IN ('PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA', 'RECIBIDA')),
    total REAL NOT NULL DEFAULT 0,
    rol_aprobador_requerido TEXT NOT NULL,
    cotizaciones_requeridas INTEGER NOT NULL DEFAULT 1,
    aprobado_por TEXT,
    fecha_aprobacion DATETIME,
    es_posible_duplicado BOOLEAN DEFAULT 0,
    motivo_duplicado TEXT,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

-- 7. Detalle de Órdenes de Compra
CREATE TABLE IF NOT EXISTS ordenes_compra_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orden_compra_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    cantidad REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    precio_contratado_referencia REAL,
    sobreprecio_unitario REAL DEFAULT 0,
    FOREIGN KEY (orden_compra_id) REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materiales(id)
);

-- 8. Movimientos de Inventario (Entradas, Salidas, Traslados, Ajustes)
-- Trazabilidad total: El stock actual se deduce de la suma algebraica de estos movimientos
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    bodega_id INTEGER NOT NULL,
    bodega_destino_id INTEGER,
    tipo_movimiento TEXT NOT NULL CHECK(tipo_movimiento IN ('ENTRADA', 'SALIDA', 'TRASLADO', 'AJUSTE')),
    cantidad REAL NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario TEXT NOT NULL,
    documento_origen_tipo TEXT NOT NULL CHECK(documento_origen_tipo IN ('ORDEN_COMPRA', 'VALE_SALIDA', 'GUIA_TRASLADO', 'AJUSTE_INVENTARIO', 'SALDO_INICIAL')),
    documento_origen_numero TEXT,
    motivo TEXT,
    FOREIGN KEY (material_id) REFERENCES materiales(id),
    FOREIGN KEY (bodega_id) REFERENCES bodegas_obras(id),
    FOREIGN KEY (bodega_destino_id) REFERENCES bodegas_obras(id)
);

-- 9. Alertas de Reorden
CREATE TABLE IF NOT EXISTS alertas_reorden (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL,
    fecha_alerta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stock_al_momento REAL NOT NULL,
    punto_reorden REAL NOT NULL,
    stock_seguridad REAL NOT NULL,
    deficit REAL NOT NULL,
    prioridad TEXT NOT NULL CHECK(prioridad IN ('CRITICA', 'URGENTE', 'MODERADA')),
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE', 'ATENDIDA')),
    FOREIGN KEY (material_id) REFERENCES materiales(id)
);

-- Índices para optimización de consultas operativas
CREATE INDEX IF NOT EXISTS idx_mov_material ON movimientos_inventario(material_id);
CREATE INDEX IF NOT EXISTS idx_mov_bodega ON movimientos_inventario(bodega_id);
CREATE INDEX IF NOT EXISTS idx_mov_doc ON movimientos_inventario(documento_origen_numero);
CREATE INDEX IF NOT EXISTS idx_oc_fecha ON ordenes_compra(fecha);
CREATE INDEX IF NOT EXISTS idx_oc_proveedor ON ordenes_compra(proveedor_id);
