const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sincronizarAlertasReorden } = require('./services/reordenService');
const { detectarPosiblesDuplicados } = require('./services/duplicadosService');

// Importación de rutas
const materialesRoutes = require('./routes/materialesRoutes');
const movimientosRoutes = require('./routes/movimientosRoutes');
const ordenesRoutes = require('./routes/ordenesRoutes');
const alertasRoutes = require('./routes/alertasRoutes');
const trazabilidadRoutes = require('./routes/trazabilidadRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend web estático (Dashboard interactivo - Puntos extra)
app.use(express.static(path.join(__dirname, 'public')));

// Registro de Rutas API REST
app.use('/api/materiales', materialesRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/trazabilidad', trazabilidadRoutes);

// Endpoint de diagnóstico del sistema
app.get('/api/info', (req, res) => {
  res.json({
    empresa: 'Constructora Del Valle S.A.',
    sistema: 'Sistema de Gestión de Inventarios y Control de Compras',
    version: '1.0.0',
    estado: 'OPERATIVO',
    fecha_servidor: new Date().toISOString(),
    rutas_disponibles: [
      'GET  /api/materiales',
      'GET  /api/materiales/:id/stock',
      'POST /api/movimientos',
      'GET  /api/movimientos',
      'GET  /api/ordenes',
      'POST /api/ordenes',
      'POST /api/ordenes/:id/aprobar',
      'POST /api/ordenes/:id/recibir',
      'GET  /api/ordenes/posibles-duplicados',
      'GET  /api/alertas/reorden',
      'GET  /api/trazabilidad/:id'
    ]
  });
});

// Inicialización de auditorías y servidor
function startServer() {
  try {
    // Sincronización inicial de alertas de reorden y duplicados
    sincronizarAlertasReorden();
    detectarPosiblesDuplicados();

    const server = app.listen(PORT, () => {
      console.log('================================================================');
      console.log('  CONSTRUCTORA DEL VALLE S.A. - SISTEMA DE GESTIÓN DE INVENTARIOS');
      console.log('================================================================');
      console.log(`✓ Servidor HTTP escuchando en el puerto: ${PORT}`);
      console.log(`✓ Dashboard Web Interactivo: http://localhost:${PORT}`);
      console.log(`✓ API REST Base: http://localhost:${PORT}/api/info`);
      console.log('================================================================');
    });

    return server;
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
