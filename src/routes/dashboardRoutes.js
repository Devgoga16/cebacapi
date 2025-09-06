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

module.exports = router;
