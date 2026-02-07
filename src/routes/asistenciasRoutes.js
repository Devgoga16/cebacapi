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

/**
 * @swagger
 * /asistencias/aula/{id_aula}/alumno/{id_alumno}:
 *   get:
 *     summary: Obtiene el resumen y detalle de asistencia de un alumno en un aula
 *     tags: [Asistencias]
 *     parameters:
 *       - in: path
 *         name: id_aula
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *       - in: path
 *         name: id_alumno
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del alumno
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha inicio (YYYY-MM-DD)
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Resumen y detalle de asistencia del alumno
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
 *                     alumno:
 *                       type: object
 *                     rango:
 *                       type: object
 *                       properties:
 *                         desde:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                         hasta:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                     resumen:
 *                       type: object
 *                       properties:
 *                         presente:
 *                           type: integer
 *                         ausente:
 *                           type: integer
 *                         tarde:
 *                           type: integer
 *                         justificado:
 *                           type: integer
 *                         total_registros:
 *                           type: integer
 *                         porcentaje_presente:
 *                           type: number
 *                         porcentaje_efectivo:
 *                           type: number
 *                     detalle:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fecha:
 *                             type: string
 *                             format: date
 *                           estado:
 *                             type: string
 *                           observacion:
 *                             type: string
 *                           tomado_por:
 *                             type: object
 */
router.get('/asistencias/aula/:id_aula/alumno/:id_alumno', asistenciasController.getResumenDetalleAsistenciaAlumno);

/**
 * @swagger
 * /asistencias/reporte/ciclo/{id_ciclo}:
 *   get:
 *     summary: Obtiene el reporte de asistencias por ciclo con KPIs separados por género
 *     tags: [Asistencias]
 *     parameters:
 *       - in: path
 *         name: id_ciclo
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ciclo
 *     responses:
 *       200:
 *         description: Reporte de asistencias con KPIs por género
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     ciclo:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         nombre:
 *                           type: string
 *                         anio:
 *                           type: number
 *                     alumnos_inscritos:
 *                       type: object
 *                       properties:
 *                         masculino:
 *                           type: number
 *                         femenino:
 *                           type: number
 *                         total:
 *                           type: number
 *                     porcentaje_asistencia_alumnos:
 *                       type: object
 *                       properties:
 *                         masculino:
 *                           type: number
 *                         femenino:
 *                           type: number
 *                         total:
 *                           type: number
 *                     profesores_asignados:
 *                       type: object
 *                       properties:
 *                         masculino:
 *                           type: number
 *                         femenino:
 *                           type: number
 *                         total:
 *                           type: number
 *                     porcentaje_asistencia_profesores:
 *                       type: object
 *                       properties:
 *                         masculino:
 *                           type: number
 *                         femenino:
 *                           type: number
 *                         total:
 *                           type: number
 */
router.get('/asistencias/reporte/ciclo/:id_ciclo', asistenciasController.getReporteAsistenciasPorCiclo);

/**
 * @swagger
 * /asistencias/alumnos-por-ministerio/ciclo/{id_ciclo}:
 *   get:
 *     summary: Obtiene la cantidad de alumnos por ministerio y género para un ciclo
 *     tags: [Asistencias]
 *     parameters:
 *       - in: path
 *         name: id_ciclo
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ciclo
 *     responses:
 *       200:
 *         description: Lista de alumnos agrupados por ministerio y género
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id_ministerio:
 *                         type: string
 *                       ministerio:
 *                         type: string
 *                       masculino:
 *                         type: number
 *                       femenino:
 *                         type: number
 *                       total:
 *                         type: number
 */
router.get('/asistencias/alumnos-por-ministerio/ciclo/:id_ciclo', asistenciasController.getAlumnosPorMinisterioPorCiclo);

module.exports = router;
