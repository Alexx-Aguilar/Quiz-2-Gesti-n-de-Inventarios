const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db/database');
const { calcularMetricasMaterial, obtenerInventarioCompleto } = require('../services/reordenService');

// GET /api/materiales - Catálogo completo con cálculos dinámicos de inventario
router.get('/', (req, res) => {
  try {
    const inventario = obtenerInventarioCompleto();
    res.json({
      success: true,
      total: inventario.length,
      data: inventario
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/materiales/:id/stock - Stock actual, PR y estado de un material específico
router.get('/:id/stock', (req, res) => {
  try {
    const materialId = parseInt(req.params.id, 10);
    const metricas = calcularMetricasMaterial(materialId);

    if (!metricas) {
      return res.status(404).json({ success: false, error: 'Material no encontrado' });
    }

    res.json({
      success: true,
      data: metricas
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/materiales - Registrar un nuevo material
router.post('/', (req, res) => {
  try {
    const {
      codigo_estandar,
      nombre,
      categoria_id,
      unidad_medida,
      demanda_promedio_diaria,
      demanda_maxima_diaria,
      tiempo_entrega_dias,
      stock_minimo,
      stock_maximo,
      precio_referencia
    } = req.body;

    if (!codigo_estandar || !nombre || !categoria_id || !unidad_medida) {
      return res.status(400).json({
        success: false,
        error: 'Los campos codigo_estandar, nombre, categoria_id y unidad_medida son obligatorios'
      });
    }

    const result = run(`
      INSERT INTO materiales (
        codigo_estandar, nombre, categoria_id, unidad_medida,
        demanda_promedio_diaria, demanda_maxima_diaria, tiempo_entrega_dias,
        stock_minimo, stock_maximo, precio_referencia
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codigo_estandar,
      nombre,
      categoria_id,
      unidad_medida,
      demanda_promedio_diaria || 0,
      demanda_maxima_diaria || 0,
      tiempo_entrega_dias || 1,
      stock_minimo || 0,
      stock_maximo || 0,
      precio_referencia || 0
    ]);

    const nuevo = calcularMetricasMaterial(result.lastInsertRowid);
    res.status(201).json({
      success: true,
      mensaje: 'Material registrado exitosamente',
      data: nuevo
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
