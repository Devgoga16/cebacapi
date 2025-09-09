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

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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

// Middleware de manejo de errores
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
  console.log(`Documentación Swagger en http://localhost:${port}/api-docs`);
});
