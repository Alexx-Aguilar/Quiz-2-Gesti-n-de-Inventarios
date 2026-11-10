const { db, query, get, run } = require('../db/database');

/**
 * Servicio de Cálculo de Niveles de Stock, Stock de Seguridad y Punto de Reorden
 * Constructora Del Valle S.A.
 * 
 * Fórmulas oficiales del Quiz:
 * - Demanda diaria promedio: d
 * - Demanda diaria máxima: d_max
 * - Tiempo de entrega en días: L
 * - Stock de Seguridad (SS): (d_max - d) * L
 * - Punto de Reorden (PR): d * L + SS = d_max * L
 * - Stock Actual: Derivado estrictamente de la suma algebraica de movimientos_inventario
 */

/**
 * Obtiene el stock actual de un material sumando sus movimientos
 * @param {number} materialId
 * @param {number|null} bodegaId - Opcional. Si se pasa, filtra por bodega específica
 */
function calcularStockActual(materialId, bodegaId = null) {
  if (bodegaId) {
    // Stock en una bodega específica
    const entradas = get(`
      SELECT COALESCE(SUM(cantidad), 0) as total
      FROM movimientos_inventario
      WHERE material_id = ? AND (
        (bodega_id = ? AND tipo_movimiento IN ('ENTRADA', 'SALDO_INICIAL')) OR
        (bodega_destino_id = ? AND tipo_movimiento = 'TRASLADO')
      )
    `, [materialId, bodegaId, bodegaId])?.total || 0;

    const salidas = get(`
      SELECT COALESCE(SUM(cantidad), 0) as total
      FROM movimientos_inventario
      WHERE material_id = ? AND (
        (bodega_id = ? AND tipo_movimiento IN ('SALIDA', 'TRASLADO'))
      )
    `, [materialId, bodegaId])?.total || 0;

    const ajustes = get(`
      SELECT COALESCE(SUM(cantidad), 0) as total
      FROM movimientos_inventario
      WHERE material_id = ? AND bodega_id = ? AND tipo_movimiento = 'AJUSTE'
    `, [materialId, bodegaId])?.total || 0;

    return Number(entradas) - Number(salidas) + Number(ajustes);
  }

  // Stock consolidado a nivel empresa (los traslados internos son neutrales)
  const result = get(`
    SELECT 
      COALESCE(SUM(CASE 
        WHEN tipo_movimiento IN ('ENTRADA', 'SALDO_INICIAL') THEN cantidad
        WHEN tipo_movimiento = 'SALIDA' THEN -cantidad
        WHEN tipo_movimiento = 'AJUSTE' THEN cantidad
        ELSE 0 
      END), 0) as stock_total
    FROM movimientos_inventario
    WHERE material_id = ?
  `, [materialId]);

  return Number(result?.stock_total || 0);
}

/**
 * Calcula los parámetros dinámicos de inventario para un material
 * @param {number} materialId
 */
function calcularMetricasMaterial(materialId) {
  const material = get(`
    SELECT m.*, c.subcategoria, c.categoria_padre 
    FROM materiales m
    JOIN categorias c ON m.categoria_id = c.id
    WHERE m.id = ?
  `, [materialId]);

  if (!material) return null;

  const d = Number(material.demanda_promedio_diaria);
  const dMax = Number(material.demanda_maxima_diaria);
  const L = Number(material.tiempo_entrega_dias);

  // Fórmulas requeridas
  const stockSeguridad = (dMax - d) * L;
  const puntoReorden = (d * L) + stockSeguridad; // Equivalente a dMax * L
  const stockActual = calcularStockActual(materialId);
  const requiereReorden = stockActual <= puntoReorden;
  const deficit = requiereReorden ? (puntoReorden - stockActual) : 0;

  // Días de inventario restante a demanda promedio y a demanda máxima
  const diasCoberturaPromedio = d > 0 ? (stockActual / d).toFixed(2) : 'N/A';
  const diasCoberturaCritica = dMax > 0 ? (stockActual / dMax).toFixed(2) : 'N/A';

  // Clasificación de prioridad de reposición
  const diasCriticosNum = dMax > 0 ? (stockActual / dMax) : 999;
  let prioridad = 'OPTIMO';
  if (requiereReorden) {
    if (stockActual <= stockSeguridad || diasCriticosNum <= L) {
      prioridad = 'CRITICA'; // Consumiendo stock de seguridad o riesgo inminente de rotura antes de entrega
    } else if (stockActual <= (puntoReorden * 0.85)) {
      prioridad = 'URGENTE';
    } else {
      prioridad = 'MODERADA';
    }
  }

  return {
    id: material.id,
    codigo_estandar: material.codigo_estandar,
    nombre: material.nombre,
    unidad_medida: material.unidad_medida,
    categoria: material.categoria_padre,
    subcategoria: material.subcategoria,
    demanda_promedio_diaria: d,
    demanda_maxima_diaria: dMax,
    tiempo_entrega_dias: L,
    stock_actual: stockActual,
    stock_seguridad: stockSeguridad,
    punto_reorden: puntoReorden,
    requiere_reorden: requiereReorden,
    deficit,
    prioridad,
    dias_cobertura_promedio: diasCoberturaPromedio,
    dias_cobertura_critica: diasCoberturaCritica,
    precio_referencia: material.precio_referencia
  };
}

/**
 * Devuelve todo el catálogo de materiales con sus métricas calculadas
 */
function obtenerInventarioCompleto() {
  const materiales = query(`SELECT id FROM materiales ORDER BY id ASC`);
  return materiales.map(m => calcularMetricasMaterial(m.id));
}

/**
 * Escanea el inventario y actualiza la tabla de alertas_reorden
 */
function sincronizarAlertasReorden() {
  const inventario = obtenerInventarioCompleto();
  const alertasGeneradas = [];

  for (const item of inventario) {
    if (item.requiere_reorden) {
      // Verificar si ya existe una alerta pendiente para este material
      const existente = get(`
        SELECT id FROM alertas_reorden 
        WHERE material_id = ? AND estado = 'PENDIENTE'
      `, [item.id]);

      if (existente) {
        // Actualizar valores actuales
        run(`
          UPDATE alertas_reorden 
          SET stock_al_momento = ?, punto_reorden = ?, stock_seguridad = ?, deficit = ?, prioridad = ?, fecha_alerta = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [item.stock_actual, item.punto_reorden, item.stock_seguridad, item.deficit, item.prioridad, existente.id]);
        alertasGeneradas.push({ id: existente.id, ...item, accion: 'ACTUALIZADA' });
      } else {
        // Crear nueva alerta
        const resultado = run(`
          INSERT INTO alertas_reorden (material_id, stock_al_momento, punto_reorden, stock_seguridad, deficit, prioridad, estado)
          VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE')
        `, [item.id, item.stock_actual, item.punto_reorden, item.stock_seguridad, item.deficit, item.prioridad]);
        alertasGeneradas.push({ id: resultado.lastInsertRowid, ...item, accion: 'CREADA' });
      }
    } else {
      // Si el stock ya superó el PR, cerrar alertas pendientes
      run(`
        UPDATE alertas_reorden 
        SET estado = 'ATENDIDA' 
        WHERE material_id = ? AND estado = 'PENDIENTE'
      `, [item.id]);
    }
  }

  return alertasGeneradas;
}

module.exports = {
  calcularStockActual,
  calcularMetricasMaterial,
  obtenerInventarioCompleto,
  sincronizarAlertasReorden
};
