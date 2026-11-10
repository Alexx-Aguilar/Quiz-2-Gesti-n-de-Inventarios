const express = require('express');
const router = express.Router();
const { obtenerTrazabilidadMaterial } = require('../services/trazabilidadService');

// GET /api/trazabilidad/:id - Auditoría completa de existencias, movimientos y OCs de origen
router.get('/:id', (req, res) => {
  try {
    const materialId = parseInt(req.params.id, 10);
    const trazabilidad = obtenerTrazabilidadMaterial(materialId);

    if (!trazabilidad) {
      return res.status(404).json({ success: false, error: 'Material no encontrado' });
    }

    res.json({
      success: true,
      data: trazabilidad
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
