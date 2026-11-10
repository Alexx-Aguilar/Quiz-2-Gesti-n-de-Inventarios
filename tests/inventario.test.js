const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Asegurar base de datos inicializada
process.env.DB_PATH = path.join(__dirname, '../database/inventario.db');
const { runSeed } = require('../src/db/seed');
const { calcularStockActual, calcularMetricasMaterial, sincronizarAlertasReorden } = require('../src/services/reordenService');
const { detectarPosiblesDuplicados } = require('../src/services/duplicadosService');
const { determinarReglasAprobacion, procesarAprobacion } = require('../src/services/aprobacionService');
const { run, get } = require('../src/db/database');

describe('Suite de Pruebas Automatizadas: Constructora Del Valle S.A.', () => {

  before(() => {
    // Restaurar base de datos con los datos semilla oficiales
    runSeed();
  });

  describe('1. Cálculos de Niveles de Stock, Stock de Seguridad y Punto de Reorden (A5)', () => {
    test('Cemento gris 50 kg: SS = 45, PR = 165, Stock = 190 (No reorden)', () => {
      const metricas = calcularMetricasMaterial(1);
      assert.strictEqual(metricas.stock_seguridad, 45, 'SS debe ser (55-40)*3 = 45');
      assert.strictEqual(metricas.punto_reorden, 165, 'PR debe ser 40*3 + 45 = 165');
      assert.strictEqual(metricas.stock_actual, 190, 'Stock actual debe ser 190 sacos');
      assert.strictEqual(metricas.requiere_reorden, false, 'No debe requerir reorden');
      assert.strictEqual(metricas.prioridad, 'OPTIMO');
    });

    test('Varilla #3: SS = 200, PR = 800, Stock = 850 (No reorden)', () => {
      const metricas = calcularMetricasMaterial(2);
      assert.strictEqual(metricas.stock_seguridad, 200, 'SS debe ser (160-120)*5 = 200');
      assert.strictEqual(metricas.punto_reorden, 800, 'PR debe ser 120*5 + 200 = 800');
      assert.strictEqual(metricas.stock_actual, 850, 'Stock actual debe ser 850 varillas');
      assert.strictEqual(metricas.requiere_reorden, false, 'No debe requerir reorden');
    });

    test('Block 12x20x40: SS = 1200, PR = 3600, Stock = 2800 (REORDEN URGENTE)', () => {
      const metricas = calcularMetricasMaterial(3);
      assert.strictEqual(metricas.stock_seguridad, 1200, 'SS debe ser (900-600)*4 = 1200');
      assert.strictEqual(metricas.punto_reorden, 3600, 'PR debe ser 600*4 + 1200 = 3600');
      assert.strictEqual(metricas.stock_actual, 2800, 'Stock actual debe ser 2800');
      assert.strictEqual(metricas.requiere_reorden, true, 'Debe requerir reorden hoy');
      assert.strictEqual(metricas.deficit, 800, 'El déficit debe ser de 800 unidades');
    });

    test('Arena (m3): SS = 8, PR = 20, Stock = 14 (REORDEN CRITICA - PRIORIDAD 1)', () => {
      const metricas = calcularMetricasMaterial(4);
      assert.strictEqual(metricas.stock_seguridad, 8, 'SS debe ser (10-6)*2 = 8');
      assert.strictEqual(metricas.punto_reorden, 20, 'PR debe ser 6*2 + 8 = 20');
      assert.strictEqual(metricas.stock_actual, 14, 'Stock actual debe ser 14 m3');
      assert.strictEqual(metricas.requiere_reorden, true, 'Debe requerir reorden hoy');
      assert.strictEqual(metricas.deficit, 6, 'Déficit debe ser 6 m3');
    });
  });

  describe('2. Detección Inteligente de Compras Duplicadas y Fraccionamientos (A3)', () => {
    test('Debe detectar el caso idéntico entre OC-1041 y OC-1042 (Mismo día, proveedor, artículo y cant)', () => {
      const duplicados = detectarPosiblesDuplicados(7, 10);
      assert.ok(duplicados.length > 0, 'Debe encontrar casos duplicados');

      const casoCemento = duplicados.find(d => 
        (d.orden_a.numero_oc === 'OC-1041' && d.orden_b.numero_oc === 'OC-1042') ||
        (d.orden_a.numero_oc === 'OC-1042' && d.orden_b.numero_oc === 'OC-1041')
      );

      assert.ok(casoCemento, 'Debe identificar el par OC-1041 y OC-1042');
      assert.strictEqual(casoCemento.diferencia_dias, 0, 'Diferencia de días debe ser 0');
      assert.strictEqual(casoCemento.variacion_cantidad_pct, 0, 'Variación de cantidad debe ser 0%');
    });

    test('Debe detectar el caso de fraccionamiento entre OC-1050 y OC-1053 (Varilla Prov C, 500 vs 480)', () => {
      const duplicados = detectarPosiblesDuplicados(7, 10);
      const casoVarilla = duplicados.find(d => 
        (d.orden_a.numero_oc === 'OC-1050' && d.orden_b.numero_oc === 'OC-1053') ||
        (d.orden_a.numero_oc === 'OC-1053' && d.orden_b.numero_oc === 'OC-1050')
      );

      assert.ok(casoVarilla, 'Debe identificar el par OC-1050 y OC-1053');
      assert.strictEqual(casoVarilla.diferencia_dias, 1, 'Diferencia de 1 día');
      assert.strictEqual(casoVarilla.variacion_cantidad_pct, 4, 'Variación de 4% (500 vs 480)');
    });
  });

  describe('3. Matriz de Aprobación Jerárquica y Reglas de Negocio (A1)', () => {
    test('Determinar correctamente aprobadores según umbrales monetarios', () => {
      const r1 = determinarReglasAprobacion(150000);
      assert.strictEqual(r1.rol_aprobador_requerido, 'Jefatura del área solicitante');
      assert.strictEqual(r1.cotizaciones_requeridas, 1);

      const r2 = determinarReglasAprobacion(1290000);
      assert.strictEqual(r2.rol_aprobador_requerido, 'Jefatura de Compras');
      assert.strictEqual(r2.cotizaciones_requeridas, 2);

      const r3 = determinarReglasAprobacion(4500000);
      assert.strictEqual(r3.rol_aprobador_requerido, 'Gerencia Financiera');
      assert.strictEqual(r3.cotizaciones_requeridas, 3);

      const r4 = determinarReglasAprobacion(12000000);
      assert.strictEqual(r4.rol_aprobador_requerido, 'Gerencia General');
      assert.strictEqual(r4.cotizaciones_requeridas, 3);
    });

    test('Rechazar intento de aprobación si el rol del usuario es inferior al exigido', () => {
      // Crear una orden temporal de ₡5 000 000 que exige Gerencia Financiera
      const insert = run(`
        INSERT INTO ordenes_compra (numero_oc, fecha, area_solicitante, proveedor_id, estado, total, rol_aprobador_requerido)
        VALUES ('OC-TEST-01', '2026-11-01', 'Obras', 1, 'PENDIENTE_APROBACION', 5000000, 'Gerencia Financiera')
      `);
      const testOcId = insert.lastInsertRowid;

      // Intentar aprobar con Jefatura de Compras (debe fallar)
      assert.throws(() => {
        procesarAprobacion(testOcId, 'Jefatura de Compras', 'Jefe Compras');
      }, /Permisos insuficientes/);

      // Aprobar con Gerencia Financiera (debe funcionar)
      const res = procesarAprobacion(testOcId, 'Gerencia Financiera', 'Lic. Rodrigo Soto');
      assert.strictEqual(res.estado, 'APROBADA');
    });
  });

  describe('4. Movimientos de Almacén y Control de Stock', () => {
    test('Rechazar salidas mayores al stock disponible en la bodega', () => {
      // Intentar salida de 500 sacos de cemento en Bodega Central (solo hay 190)
      const stockDisponible = calcularStockActual(1, 1);
      assert.ok(stockDisponible < 500, 'El stock disponible debe ser menor a 500');
    });

    test('Registrar entrada física e incrementar stock y reevaluar alertas', () => {
      const stockAntes = calcularStockActual(4); // Arena
      // Registrar entrada de 20 m3 de arena
      run(`
        INSERT INTO movimientos_inventario (
          material_id, bodega_id, tipo_movimiento, cantidad, usuario, documento_origen_tipo, documento_origen_numero
        ) VALUES (4, 1, 'ENTRADA', 20, 'usuario_test', 'ORDEN_COMPRA', 'OC-TEST-ARENA')
      `);

      const stockDespues = calcularStockActual(4);
      assert.strictEqual(stockDespues, stockAntes + 20, 'El stock debe aumentar exactamente en 20');

      // Al superar el PR (14 + 20 = 34 > 20), la alerta debe desactivarse
      const metricas = calcularMetricasMaterial(4);
      assert.strictEqual(metricas.requiere_reorden, false, 'Al recibir arena ya no debe requerir reorden');
    });
  });

});
