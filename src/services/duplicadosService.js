const { query, run } = require('../db/database');
require('dotenv').config();

const DEFAULT_DIAS_VENTANA = parseInt(process.env.DUPLICADOS_DIAS_VENTANA, 10) || 7;
const DEFAULT_TOLERANCIA_CANTIDAD = parseFloat(process.env.DUPLICADOS_TOLERANCIA_CANTIDAD_PORCENTAJE) || 10.0;

/**
 * Servicio de Detección de Posibles Compras Duplicadas y Fraccionamiento de Órdenes
 * 
 * Regla documentada de negocio:
 * Dos órdenes de compra A y B se consideran sospechosas si:
 * 1. Mismo proveedor (o proveedor vinculado).
 * 2. Mismo artículo/material_id.
 * 3. Ventana de tiempo: |Fecha(A) - Fecha(B)| <= diasVentana (por defecto 7 días).
 * 4. Cantidad similar: (|Cant(A) - Cant(B)| / max(Cant(A), Cant(B))) * 100 <= toleranciaPorcentaje (por defecto 10%).
 * 5. Evaluación de fraccionamiento presupuestario (Splitting): si la suma de montos evade un umbral superior de aprobación.
 */

function detectarPosiblesDuplicados(diasVentana = DEFAULT_DIAS_VENTANA, toleranciaPorcentaje = DEFAULT_TOLERANCIA_CANTIDAD) {
  // Obtener todas las líneas de órdenes con datos relevantes
  const lineas = query(`
    SELECT 
      oc.id as oc_id,
      oc.numero_oc,
      oc.fecha,
      oc.area_solicitante,
      oc.proveedor_id,
      p.nombre as proveedor_nombre,
      oc.total as oc_total,
      d.id as detalle_id,
      d.material_id,
      m.codigo_estandar,
      m.nombre as material_nombre,
      d.cantidad,
      d.precio_unitario,
      d.subtotal
    FROM ordenes_compra oc
    JOIN ordenes_compra_detalle d ON oc.id = d.orden_compra_id
    JOIN proveedores p ON oc.proveedor_id = p.id
    JOIN materiales m ON d.material_id = m.id
    WHERE oc.estado != 'RECHAZADA'
    ORDER BY d.material_id, oc.proveedor_id, oc.fecha ASC
  `);

  const posiblesDuplicados = [];
  const ocsMarcadas = new Map(); // id -> motivo

  for (let i = 0; i < lineas.length; i++) {
    for (let j = i + 1; j < lineas.length; j++) {
      const a = lineas[i];
      const b = lineas[j];

      // Criterio 1 & 2: Mismo proveedor y mismo material
      if (a.proveedor_id === b.proveedor_id && a.material_id === b.material_id && a.oc_id !== b.oc_id) {
        // Criterio 3: Diferencia de fechas
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        const diffTiempo = Math.abs(fechaB - fechaA);
        const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

        if (diffDias <= diasVentana) {
          // Criterio 4: Cantidad similar
          const maxCant = Math.max(a.cantidad, b.cantidad);
          const diffCant = Math.abs(a.cantidad - b.cantidad);
          const diffPorcentaje = (diffCant / maxCant) * 100;

          if (diffPorcentaje <= toleranciaPorcentaje) {
            const sumaTotal = a.oc_total + b.oc_total;
            const esFraccionamiento = (a.oc_total <= 2000000 && b.oc_total <= 2000000 && sumaTotal > 2000000);

            const motivo = `Sospecha de duplicado o fraccionamiento entre ${a.numero_oc} y ${b.numero_oc}: ` +
              `Mismo proveedor (${a.proveedor_nombre}), mismo artículo (${a.material_nombre}), ` +
              `diferencia de ${diffDias} día(s) y variación de cantidad del ${diffPorcentaje.toFixed(1)}% ` +
              `(${a.cantidad} vs ${b.cantidad}). ` +
              (esFraccionamiento ? `¡ALERTA FRACCIONAMIENTO!: Juntas suman ₡${sumaTotal.toLocaleString('es-CR')} superando el umbral de ₡2.000.000.` : '');

            posiblesDuplicados.push({
              orden_a: {
                id: a.oc_id,
                numero_oc: a.numero_oc,
                fecha: a.fecha,
                area: a.area_solicitante,
                cantidad: a.cantidad,
                total: a.oc_total
              },
              orden_b: {
                id: b.oc_id,
                numero_oc: b.numero_oc,
                fecha: b.fecha,
                area: b.area_solicitante,
                cantidad: b.cantidad,
                total: b.oc_total
              },
              material: {
                id: a.material_id,
                codigo: a.codigo_estandar,
                nombre: a.material_nombre
              },
              proveedor: {
                id: a.proveedor_id,
                nombre: a.proveedor_nombre
              },
              diferencia_dias: diffDias,
              variacion_cantidad_pct: Number(diffPorcentaje.toFixed(2)),
              es_fraccionamiento_probable: esFraccionamiento,
              motivo
            });

            // Guardar para actualizar flag en base de datos
            ocsMarcadas.set(a.oc_id, motivo);
            ocsMarcadas.set(b.oc_id, motivo);
          }
        }
      }
    }
  }

  // Actualizar flags en la tabla ordenes_compra
  for (const [ocId, motivo] of ocsMarcadas.entries()) {
    run(`
      UPDATE ordenes_compra 
      SET es_posible_duplicado = 1, motivo_duplicado = ? 
      WHERE id = ?
    `, [motivo, ocId]);
  }

  return posiblesDuplicados;
}

module.exports = {
  detectarPosiblesDuplicados,
  DEFAULT_DIAS_VENTANA,
  DEFAULT_TOLERANCIA_CANTIDAD
};
