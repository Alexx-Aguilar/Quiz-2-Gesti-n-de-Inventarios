const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { calcularStockActual, calcularMetricasMaterial, sincronizarAlertasReorden } = require('../services/reordenService');

// GET /api/movimientos - Listar movimientos con filtros
router.get('/', (req, res) => {
  try {
    const { material_id, bodega_id, tipo } = req.query;
    let sql = `
      SELECT 
        m.id,
        m.fecha,
        m.tipo_movimiento,
        m.cantidad,
        m.usuario,
        m.documento_origen_tipo,
        m.documento_origen_numero,
        m.motivo,
        mat.codigo_estandar,
        mat.nombre as material_nombre,
        mat.unidad_medida,
        b1.nombre as bodega_origen,
        b2.nombre as bodega_destino
      FROM movimientos_inventario m
      JOIN materiales mat ON m.material_id = mat.id
      JOIN bodegas_obras b1 ON m.bodega_id = b1.id
      LEFT JOIN bodegas_obras b2 ON m.bodega_destino_id = b2.id
      WHERE 1=1
    `;
    const params = [];

    if (material_id) {
      sql += ' AND m.material_id = ?';
      params.push(material_id);
    }
    if (bodega_id) {
      sql += ' AND (m.bodega_id = ? OR m.bodega_destino_id = ?)';
      params.push(bodega_id, bodega_id);
    }
    if (tipo) {
      sql += ' AND m.tipo_movimiento = ?';
      params.push(tipo.toUpperCase());
    }

    sql += ' ORDER BY m.fecha DESC, m.id DESC LIMIT 100';

    const movimientos = query(sql, params);
    res.json({
      success: true,
      total: movimientos.length,
      data: movimientos
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/movimientos - Registrar entrada, salida, traslado o ajuste y recalcular
router.post('/', (req, res) => {
  try {
    const {
      material_id,
      bodega_id,
      bodega_destino_id,
      tipo_movimiento,
      cantidad,
      usuario,
      documento_origen_tipo,
      documento_origen_numero,
      motivo
    } = req.body;

    // 1. Validaciones básicas
    if (!material_id || !bodega_id || !tipo_movimiento || !cantidad || !usuario || !documento_origen_tipo) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: material_id, bodega_id, tipo_movimiento, cantidad, usuario, documento_origen_tipo'
      });
    }

    const cantNum = parseFloat(cantidad);
    if (isNaN(cantNum) || cantNum <= 0) {
      return res.status(400).json({
        success: false,
        error: 'La cantidad debe ser un número positivo mayor a 0'
      });
    }

    const tiposValidos = ['ENTRADA', 'SALIDA', 'TRASLADO', 'AJUSTE'];
    if (!tiposValidos.includes(tipo_movimiento.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Tipo de movimiento inválido. Permitidos: ${tiposValidos.join(', ')}`
      });
    }

    const material = get('SELECT id, nombre FROM materiales WHERE id = ?', [material_id]);
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material no encontrado' });
    }

    const bodega = get('SELECT id, nombre FROM bodegas_obras WHERE id = ?', [bodega_id]);
    if (!bodega) {
      return res.status(404).json({ success: false, error: 'Bodega de origen no encontrada' });
    }

    // 2. Validaciones específicas para TRASLADO
    if (tipo_movimiento.toUpperCase() === 'TRASLADO') {
      if (!bodega_destino_id) {
        return res.status(400).json({
          success: false,
          error: 'Para traslados es obligatorio indicar bodega_destino_id'
        });
      }
      if (parseInt(bodega_id, 10) === parseInt(bodega_destino_id, 10)) {
        return res.status(400).json({
          success: false,
          error: 'La bodega de origen y destino no pueden ser iguales'
        });
      }
    }

    // 3. Validación de existencias para salidas y traslados
    if (['SALIDA', 'TRASLADO'].includes(tipo_movimiento.toUpperCase())) {
      const stockDisponibleEnBodega = calcularStockActual(material_id, bodega_id);
      if (stockDisponibleEnBodega < cantNum) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente en ${bodega.nombre}. Disponible: ${stockDisponibleEnBodega}, Solicitado: ${cantNum}`
        });
      }
    }

    // 4. Inserción del movimiento
    const insertResult = run(`
      INSERT INTO movimientos_inventario (
        material_id, bodega_id, bodega_destino_id, tipo_movimiento,
        cantidad, usuario, documento_origen_tipo, documento_origen_numero, motivo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      material_id,
      bodega_id,
      bodega_destino_id || null,
      tipo_movimiento.toUpperCase(),
      cantNum,
      usuario,
      documento_origen_tipo,
      documento_origen_numero || null,
      motivo || null
    ]);

    // 5. Sincronizar alertas de reorden automáticamente
    sincronizarAlertasReorden();

    // 6. Obtener métricas recalculadas
    const metricasActualizadas = calcularMetricasMaterial(material_id);

    res.status(201).json({
      success: true,
      mensaje: `Movimiento de ${tipo_movimiento} registrado exitosamente`,
      movimiento_id: insertResult.lastInsertRowid,
      stock_actualizado: metricasActualizadas
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
