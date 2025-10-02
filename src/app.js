const errorHandler = require('./middlewares/errorHandler');
require('./config/db');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const rolesRoutes = require('./routes/rolesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const ciclosRoutes = require('./routes/ciclosRoutes');
const nivelesRoutes = require('./routes/nivelesRoutes');
const iglesiasRoutes = require('./routes/iglesiasRoutes');
const ministeriosRoutes = require('./routes/ministeriosRoutes');
const categoriaanunciosRoutes = require('./routes/categoriaanunciosRoutes');
const anunciosRoutes = require('./routes/anunciosRoutes');
const cursosRoutes = require('./routes/cursosRoutes');
const personasRoutes = require('./routes/personasRoutes');
const aulasRoutes = require('./routes/aulasRoutes');
const inscripcionesRoutes = require('./routes/inscripcionesRoutes');
const authRoutes = require('./routes/authRoutes');
const aulaalumnosRoutes = require('./routes/aulaalumnosRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const asistenciasRoutes = require('./routes/asistenciasRoutes');
const requerimientosAulaRoutes = require('./routes/requerimientosAulaRoutes');

const app = express();
app.use(cors());
// Aumenta el tamaño máximo del body para permitir imágenes en base64 u otros payloads grandes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cebac API',
      version: '1.0.0',
      description: 'API de ejemplo con Express y Swagger',
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas en raíz (compatibilidad)
app.use('/', rolesRoutes);
app.use('/', usuariosRoutes);
app.use('/', ciclosRoutes);
app.use('/', nivelesRoutes);
app.use('/', iglesiasRoutes);
app.use('/', ministeriosRoutes);
app.use('/', categoriaanunciosRoutes);
app.use('/', anunciosRoutes);
app.use('/', cursosRoutes);
app.use('/', personasRoutes);
app.use('/', aulasRoutes);
app.use('/', inscripcionesRoutes);
app.use('/', authRoutes);
app.use('/', aulaalumnosRoutes);
app.use('/', dashboardRoutes);
app.use('/', asistenciasRoutes);
app.use('/', requerimientosAulaRoutes);

// Rutas también bajo prefijo /api
app.use('/api', rolesRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', ciclosRoutes);
app.use('/api', nivelesRoutes);
app.use('/api', iglesiasRoutes);
app.use('/api', ministeriosRoutes);
app.use('/api', categoriaanunciosRoutes);
app.use('/api', anunciosRoutes);
app.use('/api', cursosRoutes);
app.use('/api', personasRoutes);
app.use('/api', aulasRoutes);
app.use('/api', inscripcionesRoutes);
app.use('/api', authRoutes);
app.use('/api', aulaalumnosRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', asistenciasRoutes);
app.use('/api', requerimientosAulaRoutes);

// Middleware de manejo de errores
app.use(errorHandler);

module.exports = app;
