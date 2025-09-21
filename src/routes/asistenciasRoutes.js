const express = require('express');
const router = express.Router();
const asistenciasController = require('../controllers/asistenciasController');

/**
 * @swagger
 * tags:
 *   name: Asistencias
 *   description: Endpoints para toma de asistencia
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AsistenciaItem:
 *       type: object
 *       properties:
 *         id_aula:
 *           type: string
 *         id_alumno:
 *           type: string
 *         estado:
 *           type: string
 *           enum: [presente, ausente, tarde, justificado]
 *         observacion:
 *           type: string
 */

/**
 * @swagger
 * /asistencias/roster/{id_aula}:
 *   get:
 *     summary: Obtiene el roster del aula para tomar asistencia en una fecha (incluye asistencias ya registradas ese día)
 *     tags: [Asistencias]
 *     parameters:
 *       - in: path
 *         name: id_aula
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha (YYYY-MM-DD). Si no se envía, se toma hoy.
 *     responses:
 *       200:
 *         description: Roster del aula para la fecha
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
 *                     aula:
 *                       type: object
 *                     fecha:
 *                       type: string
 *                       format: date
 *                     alumnos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id_alumno:
 *                             type: string
 *                           alumno:
 *                             type: object
 *                           estado:
 *                             type: string
 *                           observacion:
 *                             type: string
 */
router.get('/asistencias/roster/:id_aula', asistenciasController.getRosterDeAulaParaAsistencia);

/**
 * @swagger
 * /asistencias/tomar:
 *   post:
 *     summary: Toma asistencia en lote (upsert por alumno/aula/fecha)
 *     tags: [Asistencias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *               tomado_por:
 *                 type: string
 *                 description: ID de la persona que registra la asistencia
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AsistenciaItem'
 *     responses:
 *       200:
 *         description: Resultado del upsert masivo de asistencias
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
 *                     fecha:
 *                       type: string
 *                       format: date
 *                     matched:
 *                       type: integer
 *                     modified:
 *                       type: integer
 *                     upserts:
 *                       type: integer
 *                 message:
 *                   type: string
 */
router.post('/asistencias/tomar', asistenciasController.tomarAsistencia);

/**
 * @swagger
 * /asistencias/aula/{id_aula}:
 *   get:
 *     summary: Lista asistencias de un aula por fecha
 *     tags: [Asistencias]
 *     parameters:
 *       - in: path
 *         name: id_aula
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha (YYYY-MM-DD). Si no se envía, se toma hoy.
 *     responses:
 *       200:
 *         description: Asistencias del aula para la fecha
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
 *                     fecha:
 *                       type: string
 *                       format: date
 *                     asistencias:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/asistencias/aula/:id_aula', asistenciasController.getAsistenciasDeAulaPorFecha);

module.exports = router;
