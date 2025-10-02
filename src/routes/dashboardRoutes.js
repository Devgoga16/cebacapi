const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Endpoints para dashboard de alumno
 */

/**
 * @swagger
 * /dashboard/alumno/{id_persona}:
 *   get:
 *     summary: Dashboard para alumno
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id_persona
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la persona (alumno)
 *     responses:
 *       200:
 *         description: Datos del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/dashboard/alumno/:id_persona', dashboardController.getAlumnoDashboard);

/**
 * @swagger
 * /dashboard/docente/{id_persona}:
 *   get:
 *     summary: Dashboard para docente
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id_persona
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la persona (docente)
 *     responses:
 *       200:
 *         description: Datos del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/dashboard/docente/:id_persona', dashboardController.getDocenteDashboard);

/**
 * @swagger
 * /dashboard/admin/{id_persona}:
 *   get:
 *     summary: Dashboard para administrador
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id_persona
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la persona (admin)
 *     responses:
 *       200:
 *         description: Datos del dashboard de administrador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     cicloActual:
 *                       type: object
 *                       description: Información del ciclo actual
 *                     totalUsuarios:
 *                       type: number
 *                       description: Total de personas registradas
 *                     totalAlumnos:
 *                       type: number
 *                       description: Total de personas con rol estudiante
 *                     totalProfesores:
 *                       type: number
 *                       description: Total de personas con rol docente
 *                     totalAulas:
 *                       type: number
 *                       description: Total de aulas registradas
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/dashboard/admin/:id_persona', dashboardController.getAdminDashboard);

module.exports = router;
