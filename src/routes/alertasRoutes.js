const express = require('express');
const router = express.Router();
const { query } = require('../db/database');
const { sincronizarAlertasReorden } = require('../services/reordenService');

// GET /api/alertas/reorden - Listar materiales por debajo del punto de reorden
router.get('/reorden', (req, res) => {
  try {
    // Sincronizar primero para reflejar el estado actual
    sincronizarAlertasReorden();

    const alertas = query(`
      SELECT 
        a.id as alerta_id,
        a.fecha_alerta,
        a.prioridad,
        a.estado,
        a.stock_al_momento,
        a.punto_reorden,
        a.stock_seguridad,
        a.deficit,
        m.id as material_id,
        m.codigo_estandar,
        m.nombre as material_nombre,
        m.unidad_medida,
        m.tiempo_entrega_dias,
        m.demanda_promedio_diaria,
        m.demanda_maxima_diaria,
        c.subcategoria,
        c.categoria_padre
      FROM alertas_reorden a
      JOIN materiales m ON a.material_id = m.id
      JOIN categorias c ON m.categoria_id = c.id
      WHERE a.estado = 'PENDIENTE'
      ORDER BY 
        CASE a.prioridad 
          WHEN 'CRITICA' THEN 1 
          WHEN 'URGENTE' THEN 2 
          WHEN 'MODERADA' THEN 3 
          ELSE 4 
        END,
        a.deficit DESC
    `);

    res.json({
      success: true,
      total_alertas_activas: alertas.length,
      data: alertas
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/alertas/sincronizar - Forzar escaneo y sincronización de alertas
router.post('/sincronizar', (req, res) => {
  try {
    const resultado = sincronizarAlertasReorden();
    res.json({
      success: true,
      mensaje: 'Alertas de reorden sincronizadas con éxito',
      alertas_procesadas: resultado
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
