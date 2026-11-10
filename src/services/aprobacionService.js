const { get, run, query } = require('../db/database');
require('dotenv').config();

const UMBRAL_AREA = parseFloat(process.env.UMBRAL_JEFATURA_AREA) || 250000;
const UMBRAL_COMPRAS = parseFloat(process.env.UMBRAL_JEFATURA_COMPRAS) || 2000000;
const UMBRAL_FINANCIERA = parseFloat(process.env.UMBRAL_GERENCIA_FINANCIERA) || 10000000;

// Jerarquía de roles para aprobación
const JERARQUIA_ROLES = {
  'Jefatura del área solicitante': 1,
  'Jefatura de Compras': 2,
  'Gerencia Financiera': 3,
  'Gerencia General': 4
};

/**
 * Determina el rol aprobador y las cotizaciones obligatorias según el monto de la compra (Ejercicio A1)
 * @param {number} totalMonto
 */
function determinarReglasAprobacion(totalMonto) {
  if (totalMonto <= UMBRAL_AREA) {
    return {
      rol_aprobador_requerido: 'Jefatura del área solicitante',
      cotizaciones_requeridas: 1,
      nivel_jerarquia: 1
    };
  } else if (totalMonto <= UMBRAL_COMPRAS) {
    return {
      rol_aprobador_requerido: 'Jefatura de Compras',
      cotizaciones_requeridas: 2,
      nivel_jerarquia: 2
    };
  } else if (totalMonto <= UMBRAL_FINANCIERA) {
    return {
      rol_aprobador_requerido: 'Gerencia Financiera',
      cotizaciones_requeridas: 3,
      nivel_jerarquia: 3
    };
  } else {
    return {
      rol_aprobador_requerido: 'Gerencia General',
      cotizaciones_requeridas: 3,
      requiere_comite: true,
      nivel_jerarquia: 4
    };
  }
}

/**
 * Evalúa si una nueva orden o conjunto de órdenes presenta riesgo de fraccionamiento acumulado
 * @param {string} areaSolicitante
 * @param {number} proveedorId
 * @param {number} nuevoMonto
 * @param {number} diasVentana
 */
function evaluarRiesgoFraccionamientoAcumulado(areaSolicitante, proveedorId, nuevoMonto, diasVentana = 15) {
  const acumulado = get(`
    SELECT COALESCE(SUM(total), 0) as total_acumulado, COUNT(id) as cantidad_ordenes
    FROM ordenes_compra
    WHERE area_solicitante = ? 
      AND proveedor_id = ? 
      AND fecha >= date('now', '-' || ? || ' days')
      AND estado != 'RECHAZADA'
  `, [areaSolicitante, proveedorId, diasVentana]);

  const totalProyectado = (acumulado?.total_acumulado || 0) + nuevoMonto;
  const reglaIndividual = determinarReglasAprobacion(nuevoMonto);
  const reglaAcumulada = determinarReglasAprobacion(totalProyectado);

  const hayRiesgoFraccionamiento = reglaAcumulada.nivel_jerarquia > reglaIndividual.nivel_jerarquia;

  return {
    hayRiesgoFraccionamiento,
    total_acumulado_previo: acumulado?.total_acumulado || 0,
    cantidad_ordenes_previas: acumulado?.cantidad_ordenes || 0,
    total_proyectado: totalProyectado,
    rol_sugerido_por_acumulacion: reglaAcumulada.rol_aprobador_requerido,
    motivo: hayRiesgoFraccionamiento 
      ? `Posible fraccionamiento: En los últimos ${diasVentana} días el área acumuló ₡${(acumulado.total_acumulado).toLocaleString('es-CR')} con este proveedor. Con esta orden el gasto acumulado alcanza ₡${totalProyectado.toLocaleString('es-CR')}, requiriendo aprobación de ${reglaAcumulada.rol_aprobador_requerido}.`
      : null
  };
}

/**
 * Ejecuta el proceso de aprobación de una orden de compra validando rol y permisos
 * @param {number} ocId
 * @param {string} rolUsuario
 * @param {string} nombreUsuario
 */
function procesarAprobacion(ocId, rolUsuario, nombreUsuario) {
  const oc = get(`SELECT * FROM ordenes_compra WHERE id = ?`, [ocId]);
  if (!oc) {
    throw new Error(`La orden de compra ID ${ocId} no existe.`);
  }

  if (oc.estado === 'APROBADA') {
    throw new Error(`La orden ${oc.numero_oc} ya fue aprobada previamente por ${oc.aprobado_por}.`);
  }

  if (oc.estado === 'RECHAZADA') {
    throw new Error(`La orden ${oc.numero_oc} se encuentra rechazada.`);
  }

  const nivelRequerido = JERARQUIA_ROLES[oc.rol_aprobador_requerido] || 2;
  const nivelUsuario = JERARQUIA_ROLES[rolUsuario] || 0;

  if (nivelUsuario < nivelRequerido) {
    throw new Error(`Permisos insuficientes: La orden requiere aprobación de '${oc.rol_aprobador_requerido}' (Nivel ${nivelRequerido}), pero el usuario tiene rol '${rolUsuario}' (Nivel ${nivelUsuario}).`);
  }

  run(`
    UPDATE ordenes_compra 
    SET estado = 'APROBADA', aprobado_por = ?, fecha_aprobacion = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [`${nombreUsuario} (${rolUsuario})`, ocId]);

  return {
    success: true,
    numero_oc: oc.numero_oc,
    estado: 'APROBADA',
    aprobado_por: `${nombreUsuario} (${rolUsuario})`,
    mensaje: `Orden ${oc.numero_oc} aprobada exitosamente por ${rolUsuario}.`
  };
}

module.exports = {
  determinarReglasAprobacion,
  evaluarRiesgoFraccionamientoAcumulado,
  procesarAprobacion,
  JERARQUIA_ROLES
};
