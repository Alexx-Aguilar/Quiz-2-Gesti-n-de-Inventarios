const { query, get } = require('../db/database');
const { calcularMetricasMaterial } = require('./reordenService');

/**
 * Servicio de Trazabilidad Integral de Existencias
 * Permite auditar el ciclo de vida completo de cada existencia:
 * De qué OC provino, qué proveedor la surtió, a qué precio, y en qué obras o vales fue consumida.
 */
function obtenerTrazabilidadMaterial(materialId) {
  // 1. Métricas actuales del material
  const metricas = calcularMetricasMaterial(materialId);
  if (!metricas) return null;

  // 2. Historial cronológico de todos los movimientos
  const movimientos = query(`
    SELECT 
      m.id,
      m.fecha,
      m.tipo_movimiento,
      m.cantidad,
      m.usuario,
      m.documento_origen_tipo,
      m.documento_origen_numero,
      m.motivo,
      b1.nombre as bodega_origen,
      b2.nombre as bodega_destino
    FROM movimientos_inventario m
    LEFT JOIN bodegas_obras b1 ON m.bodega_id = b1.id
    LEFT JOIN bodegas_obras b2 ON m.bodega_destino_id = b2.id
    WHERE m.material_id = ?
    ORDER BY m.fecha DESC, m.id DESC
  `, [materialId]);

  // 3. Origen de las existencias (De qué OC y Proveedor provienen las entradas)
  const entradasPorOC = query(`
    SELECT 
      m.id as movimiento_id,
      m.fecha as fecha_recepcion,
      m.cantidad as cantidad_ingresada,
      m.documento_origen_numero as numero_oc,
      oc.id as oc_id,
      oc.fecha as fecha_oc,
      oc.area_solicitante,
      p.nombre as proveedor_nombre,
      p.codigo as proveedor_codigo,
      d.precio_unitario as precio_unitario_pagado,
      d.precio_contratado_referencia as precio_contratado,
      d.sobreprecio_unitario,
      (d.precio_unitario * m.cantidad) as valor_total_ingreso
    FROM movimientos_inventario m
    LEFT JOIN ordenes_compra oc ON m.documento_origen_numero = oc.numero_oc
    LEFT JOIN proveedores p ON oc.proveedor_id = p.id
    LEFT JOIN ordenes_compra_detalle d ON oc.id = d.orden_compra_id AND d.material_id = m.material_id
    WHERE m.material_id = ? AND m.tipo_movimiento = 'ENTRADA'
    ORDER BY m.fecha DESC
  `, [materialId]);

  // 4. Resumen consolidado por bodegas
  const existenciasPorBodega = query(`
    SELECT 
      b.id as bodega_id,
      b.nombre as bodega_nombre,
      b.tipo,
      b.ubicacion,
      COALESCE(SUM(CASE 
        WHEN m.bodega_id = b.id AND m.tipo_movimiento IN ('ENTRADA', 'SALDO_INICIAL') THEN m.cantidad
        WHEN m.bodega_destino_id = b.id AND m.tipo_movimiento = 'TRASLADO' THEN m.cantidad
        WHEN m.bodega_id = b.id AND m.tipo_movimiento IN ('SALIDA', 'TRASLADO') THEN -m.cantidad
        WHEN m.bodega_id = b.id AND m.tipo_movimiento = 'AJUSTE' THEN m.cantidad
        ELSE 0 
      END), 0) as stock_bodega
    FROM bodegas_obras b
    LEFT JOIN movimientos_inventario m ON (m.bodega_id = b.id OR m.bodega_destino_id = b.id) AND m.material_id = ?
    GROUP BY b.id
  `, [materialId]);

  return {
    material: metricas,
    existencias_por_bodega: existenciasPorBodega,
    resumen_entradas_oc: entradasPorOC,
    historial_movimientos: movimientos
  };
}

module.exports = {
  obtenerTrazabilidadMaterial
};
