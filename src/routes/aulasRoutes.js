const express = require('express');
const router = express.Router();
const aulasController = require('../controllers/aulasController');

/**
 * @swagger
 * tags:
 *   name: Aulas
 *   description: Endpoints para gestión de aulas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Aula:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         es_presencial:
 *           type: boolean
 *         id_profesor:
 *           type: string
 *           description: ID de la persona (ObjectId)
 *         id_curso:
 *           type: string
 *           description: ID del curso (ObjectId)
 *         dia:
 *           type: string
 *         hora_inicio:
 *           type: string
 *         hora_fin:
 *           type: string
 *         aforo:
 *           type: number
 *         id_ciclo:
 *           type: string
 *           description: ID del ciclo (ObjectId)
 *         fecha_inicio:
 *           type: string
 *           format: date
 *         fecha_fin:
 *           type: string
 *           format: date
 *         estado:
 *           type: string
 *           enum: [creada, iniciada, terminada]
 *         linkWhatsApp:
 *           type: string
 *           description: Enlace de WhatsApp del aula
 *         numeroAula:
 *           type: string
 *           description: Número identificador del aula
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /aulas:
 *   get:
 *     summary: Obtiene todas las aulas
 *     tags: [Aulas]
 *     responses:
 *       200:
 *         description: Lista de aulas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Aula'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/aulas', aulasController.getAllAulas);

/**
 * @swagger
 * /aulas/{id}:
 *   get:
 *     summary: Obtiene un aula por id
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Aula encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Aula'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Aula no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/aulas/:id', aulasController.getAulaById);

/**
 * @swagger
 * /aulas:
 *   post:
 *     summary: Crea una nueva aula
 *     tags: [Aulas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Aula'
 *     responses:
 *       201:
 *         description: Aula creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Aula'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/aulas', aulasController.createAula);

/**
 * @swagger
 * /aulas/{id}:
 *   put:
 *     summary: Actualiza un aula
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Aula'
 *     responses:
 *       200:
 *         description: Aula actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Aula'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Aula no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.put('/aulas/:id', aulasController.updateAula);

/**
 * @swagger
 * /aulas/{id}:
 *   delete:
 *     summary: Elimina un aula
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Aula eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Aula no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.delete('/aulas/:id', aulasController.deleteAula);

/**
 * @swagger
 * /aulas/{id}/completo:
 *   delete:
 *     summary: Elimina un aula y todas sus relaciones (borrado físico completo)
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula a eliminar
 *     responses:
 *       200:
 *         description: Aula y todas sus relaciones eliminadas correctamente
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
 *                     inscripciones:
 *                       type: integer
 *                       description: Cantidad de inscripciones eliminadas
 *                     aulaAlumnos:
 *                       type: integer
 *                       description: Cantidad de aula-alumnos eliminados
 *                     asistencias:
 *                       type: integer
 *                       description: Cantidad de asistencias eliminadas
 *                     calificaciones:
 *                       type: integer
 *                       description: Cantidad de calificaciones eliminadas
 *                     anunciosProfesor:
 *                       type: integer
 *                       description: Cantidad de anuncios eliminados
 *                     tiposCalificacion:
 *                       type: integer
 *                       description: Cantidad de tipos de calificación eliminados
 *                     requerimientosAula:
 *                       type: integer
 *                       description: Cantidad de requerimientos eliminados
 *                     aula:
 *                       type: boolean
 *                       description: Si el aula fue eliminada
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Aula no encontrada
 */
router.delete('/aulas/:id/completo', aulasController.deleteAulaCompleto);

/**
 * @swagger
 * /aulas/{id}/listas:
 *   get:
 *     summary: Obtiene las listas de AulaAlumnos e Inscripciones por aula
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Listas obtenidas
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
 *                     aulaAlumnos:
 *                       type: array
 *                       items:
 *                         type: object
 *                     inscripciones:
 *                       type: array
 *                       items:
 *                         type: object
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/aulas/:id/listas', aulasController.getListasPorAula);

/**
 * @swagger
 * /aulas/{id}/docente-resumen:
 *   get:
 *     summary: Resumen para docente del aula (header, roster, asistencia del día y totales)
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Fecha del día (YYYY-MM-DD). Si no se envía, se usa hoy.
 *     responses:
 *       200:
 *         description: Resumen de aula para docente
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
 *                     resumen_dia:
 *                       type: object
 *                       properties:
 *                         totales_por_estado:
 *                           type: object
 *                         total_registros:
 *                           type: integer
 *                     alumnos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id_alumno:
 *                             type: string
 *                           alumno:
 *                             type: object
 *                           estado_aula:
 *                             type: string
 *                           asistencia_hoy:
 *                             type: object
 *                           totales_asistencia:
 *                             type: object
 */
router.get('/aulas/:id/docente-resumen', aulasController.getDocenteResumenAula);

/**
 * @swagger
 * /aulas/{id}/admin-resumen-asistencia:
 *   get:
 *     summary: Resumen de asistencia para admin del aula (rango de fechas, totales y porcentajes)
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha inicio (YYYY-MM-DD). Por defecto, fecha_inicio del aula u hoy.
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha fin (YYYY-MM-DD). Por defecto, min(hoy, fecha_fin del aula).
 *     responses:
 *       200:
 *         description: Resumen de asistencia para admin
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
 *                     rango:
 *                       type: object
 *                       properties:
 *                         desde:
 *                           type: string
 *                           format: date
 *                         hasta:
 *                           type: string
 *                           format: date
 *                     sesiones_tomadas:
 *                       type: integer
 *                     resumen_general:
 *                       type: object
 *                     alumnos:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id_alumno:
 *                             type: string
 *                           alumno:
 *                             type: object
 *                           estado_aula:
 *                             type: string
 *                           totales:
 *                             type: object
 *                           porcentaje_presente:
 *                             type: number
 *                           porcentaje_efectivo:
 *                             type: number
 *                     timeline:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fecha:
 *                             type: string
 *                             format: date
 *                           por_estado:
 *                             type: object
 *                           total_registros:
 *                             type: integer
 */
router.get('/aulas/:id/admin-resumen-asistencia', aulasController.getAdminResumenAsistenciaAula);

/**
 * @swagger
 * /aulas/{id}/reporte-excel:
 *   get:
 *     summary: Datos para armar reporte Excel de asistencia del aula (rango de fechas)
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha inicio (YYYY-MM-DD). Por defecto, fecha_inicio del aula u hoy.
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Fecha fin (YYYY-MM-DD). Por defecto, min(hoy, fecha_fin del aula).
 *     responses:
 *       200:
 *         description: Datos para reporte Excel
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
 *                     rango:
 *                       type: object
 *                       properties:
 *                         desde:
 *                           type: string
 *                           format: date
 *                         hasta:
 *                           type: string
 *                           format: date
 *                     fechas:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: date
 *                     alumnos:
 *                       type: array
 *                       items:
 *                         type: object
 *                     asistencias:
 *                       type: array
 *                       items:
 *                         type: object
 *                     resumen_general:
 *                       type: object
 *                     resumen_por_alumno:
 *                       type: object
 */
router.get('/aulas/:id/reporte-excel', aulasController.getReporteExcelAula);

/**
 * @swagger
 * /aulas/por-curso/{id_curso}/ciclo/{id_ciclo}:
 *   get:
 *     summary: Lista aulas por curso y ciclo
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id_curso
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del curso
 *       - in: path
 *         name: id_ciclo
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ciclo
 *     responses:
 *       200:
 *         description: Lista de aulas del curso en el ciclo indicado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Aula'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/aulas/por-curso/:id_curso/ciclo/:id_ciclo', aulasController.getAulasByCursoAndCiclo);

/**
 * @swagger
 * /aulas/{id}/iniciar:
 *   post:
 *     summary: Inicia un aula si la fecha actual está dentro del rango [fecha_inicio, fecha_fin]
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Aula iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Aula'
 *                 message:
 *                   type: string
 *       400:
 *         description: Fuera de rango o estado inválido
 *       404:
 *         description: Aula no encontrada
 */
router.post('/aulas/:id/iniciar', aulasController.iniciarAula);

/**
 * @swagger
 * /aulas/profesor/{id_persona}/agrupadas/ciclos:
 *   get:
 *     summary: Lista todas las aulas donde la persona es profesor, agrupadas por ciclo
 *     tags: [Aulas]
 *     parameters:
 *       - in: path
 *         name: id_persona
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la persona (profesor)
 *     responses:
 *       200:
 *         description: Grupos de aulas por ciclo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ciclo:
 *                         type: object
 *                         description: Documento del ciclo (puede ser null si no está asignado)
 *                       aulas:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Aula'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/aulas/profesor/:id_persona/agrupadas/ciclos', aulasController.getAulasDocenteAgrupadasPorCiclo);

module.exports = router;
