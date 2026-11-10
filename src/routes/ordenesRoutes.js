const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { detectarPosiblesDuplicados } = require('../services/duplicadosService');
const { determinarReglasAprobacion, evaluarRiesgoFraccionamientoAcumulado, procesarAprobacion } = require('../services/aprobacionService');
const { sincronizarAlertasReorden } = require('../services/reordenService');

// GET /api/ordenes - Listado general de órdenes de compra
router.get('/', (req, res) => {
  try {
    const ordenes = query(`
      SELECT 
        oc.id,
        oc.numero_oc,
        oc.fecha,
        oc.area_solicitante,
        oc.proveedor_id,
        p.nombre as proveedor_nombre,
        p.codigo as proveedor_codigo,
        oc.estado,
        oc.total,
        oc.rol_aprobador_requerido,
        oc.cotizaciones_requeridas,
        oc.aprobado_por,
        oc.fecha_aprobacion,
        oc.es_posible_duplicado,
        oc.motivo_duplicado
      FROM ordenes_compra oc
      JOIN proveedores p ON oc.proveedor_id = p.id
      ORDER BY oc.fecha DESC, oc.id DESC
    `);

    // Adjuntar items de cada orden
    const ordenesConDetalle = ordenes.map(oc => {
      const items = query(`
        SELECT 
          d.id,
          d.material_id,
          m.codigo_estandar,
          m.nombre as material_nombre,
          m.unidad_medida,
          d.cantidad,
          d.precio_unitario,
          d.subtotal,
          d.precio_contratado_referencia,
          d.sobreprecio_unitario
        FROM ordenes_compra_detalle d
        JOIN materiales m ON d.material_id = m.id
        WHERE d.orden_compra_id = ?
      `, [oc.id]);

      return {
        ...oc,
        items
      };
    });

    res.json({
      success: true,
      total: ordenesConDetalle.length,
      data: ordenesConDetalle
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/ordenes/posibles-duplicados - Detección de duplicados y fraccionamientos
router.get('/posibles-duplicados', (req, res) => {
  try {
    const dias = req.query.dias ? parseInt(req.query.dias, 10) : undefined;
    const tolerancia = req.query.tolerancia ? parseFloat(req.query.tolerancia) : undefined;

    const duplicados = detectarPosiblesDuplicados(dias, tolerancia);

    res.json({
      success: true,
      total_casos_detectados: duplicados.length,
      regla_aplicada: {
        ventana_dias: dias || 7,
        tolerancia_cantidad_porcentaje: tolerancia || 10
      },
      data: duplicados
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ordenes - Crear una nueva orden de compra con matriz de aprobación y auditoría de sobreprecio
router.post('/', (req, res) => {
  try {
    const { numero_oc, fecha, area_solicitante, proveedor_id, items } = req.body;

    if (!numero_oc || !fecha || !area_solicitante || !proveedor_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Debe incluir numero_oc, fecha, area_solicitante, proveedor_id y al menos un item en items[]'
      });
    }

    // Calcular total y sobreprecios
    let totalOC = 0;
    const itemsProcesados = [];

    for (const it of items) {
      const cant = parseFloat(it.cantidad);
      const precio = parseFloat(it.precio_unitario);
      if (isNaN(cant) || cant <= 0 || isNaN(precio) || precio <= 0) {
        return res.status(400).json({ success: false, error: 'Cantidad y precio unitario deben ser positivos' });
      }

      const subtotal = cant * precio;
      totalOC += subtotal;

      // Buscar si existe contrato vigente con este proveedor
      const contrato = get(`
        SELECT precio_pactado FROM contratos 
        WHERE proveedor_id = ? AND material_id = ? AND estado = 'ACTIVO'
      `, [proveedor_id, it.material_id]);

      const precioContratado = contrato ? contrato.precio_pactado : null;
      const sobreprecio = precioContratado ? Math.max(0, precio - precioContratado) : 0;

      itemsProcesados.push({
        material_id: it.material_id,
        cantidad: cant,
        precio_unitario: precio,
        subtotal,
        precio_contratado_referencia: precioContratado,
        sobreprecio_unitario: sobreprecio
      });
    }

    // Evaluar matriz de aprobación (Ejercicio A1)
    const reglasAprobacion = determinarReglasAprobacion(totalOC);

    // Evaluar riesgo de fraccionamiento acumulado
    const evaluacionFraccionamiento = evaluarRiesgoFraccionamientoAcumulado(area_solicitante, proveedor_id, totalOC);

    let rolRequerido = reglasAprobacion.rol_aprobador_requerido;
    let motivoDuplicado = null;
    let esSospechoso = 0;

    if (evaluacionFraccionamiento.hayRiesgoFraccionamiento) {
      rolRequerido = evaluacionFraccionamiento.rol_sugerido_por_acumulacion;
      esSospechoso = 1;
      motivoDuplicado = evaluacionFraccionamiento.motivo;
    }

    // Insertar OC cabecera
    const insertOC = run(`
      INSERT INTO ordenes_compra (
        numero_oc, fecha, area_solicitante, proveedor_id, estado, total,
        rol_aprobador_requerido, cotizaciones_requeridas, es_posible_duplicado, motivo_duplicado
      ) VALUES (?, ?, ?, ?, 'PENDIENTE_APROBACION', ?, ?, ?, ?, ?)
    `, [
      numero_oc,
      fecha,
      area_solicitante,
      proveedor_id,
      totalOC,
      rolRequerido,
      reglasAprobacion.cotizaciones_requeridas,
      esSospechoso,
      motivoDuplicado
    ]);

    const ocId = insertOC.lastInsertRowid;

    // Insertar detalles
    for (const item of itemsProcesados) {
      run(`
        INSERT INTO ordenes_compra_detalle (
          orden_compra_id, material_id, cantidad, precio_unitario, subtotal,
          precio_contratado_referencia, sobreprecio_unitario
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        ocId,
        item.material_id,
        item.cantidad,
        item.precio_unitario,
        item.subtotal,
        item.precio_contratado_referencia,
        item.sobreprecio_unitario
      ]);
    }

    // Escanear duplicados
    detectarPosiblesDuplicados();

    res.status(201).json({
      success: true,
      mensaje: 'Orden de compra creada exitosamente en estado PENDIENTE_APROBACION',
      data: {
        id: ocId,
        numero_oc,
        total: totalOC,
        rol_aprobador_requerido: rolRequerido,
        cotizaciones_requeridas: reglasAprobacion.cotizaciones_requeridas,
        alerta_fraccionamiento: evaluacionFraccionamiento
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ordenes/:id/aprobar - Flujo de aprobación según matriz A1
router.post('/:id/aprobar', (req, res) => {
  try {
    const ocId = parseInt(req.params.id, 10);
    const { rol_usuario, nombre_usuario } = req.body;

    if (!rol_usuario || !nombre_usuario) {
      return res.status(400).json({
        success: false,
        error: 'Debe especificar rol_usuario y nombre_usuario para auditar la aprobación'
      });
    }

    const resultado = procesarAprobacion(ocId, rol_usuario, nombre_usuario);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/ordenes/:id/recibir - Recepción física que ingresa existencias a inventario
router.post('/:id/recibir', (req, res) => {
  try {
    const ocId = parseInt(req.params.id, 10);
    const { bodega_id, usuario } = req.body;

    const oc = get(`SELECT * FROM ordenes_compra WHERE id = ?`, [ocId]);
    if (!oc) {
      return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });
    }

    if (oc.estado !== 'APROBADA') {
      return res.status(400).json({
        success: false,
        error: `No se puede recibir una orden en estado ${oc.estado}. Debe estar APROBADA primero.`
      });
    }

    const bodegaDestino = bodega_id || 1; // Bodega Central por defecto
    const items = query(`SELECT * FROM ordenes_compra_detalle WHERE orden_compra_id = ?`, [ocId]);

    // Crear un movimiento de entrada por cada item recibido
    for (const item of items) {
      run(`
        INSERT INTO movimientos_inventario (
          material_id, bodega_id, tipo_movimiento, cantidad, usuario,
          documento_origen_tipo, documento_origen_numero, motivo
        ) VALUES (?, ?, 'ENTRADA', ?, ?, 'ORDEN_COMPRA', ?, ?)
      `, [
        item.material_id,
        bodegaDestino,
        item.cantidad,
        usuario || 'bodeguero_sistema',
        oc.numero_oc,
        `Recepción en almacén de ${oc.numero_oc}`
      ]);
    }

    // Actualizar estado de la orden
    run(`UPDATE ordenes_compra SET estado = 'RECIBIDA' WHERE id = ?`, [ocId]);

    // Sincronizar alertas de stock
    sincronizarAlertasReorden();

    res.json({
      success: true,
      mensaje: `Orden ${oc.numero_oc} recibida con éxito. Las existencias han ingresado al inventario.`,
      items_recibidos: items.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
