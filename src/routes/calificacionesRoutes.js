const express = require('express');
const router = express.Router();
const calificacionesController = require('../controllers/calificacionesController');

/**
 * @swagger
 * tags:
 *   name: Calificaciones
 *   description: Endpoints para gestión de calificaciones y notas de alumnos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CalificacionItem:
 *       type: object
 *       required:
 *         - id_aula
 *         - id_alumno
 *         - id_tipo_calificacion
 *         - nota
 *       properties:
 *         id_aula:
 *           type: string
 *           description: ID del aula
 *         id_alumno:
 *           type: string
 *           description: ID del alumno
 *         id_tipo_calificacion:
 *           type: string
 *           description: ID del tipo de calificación
 *         nota:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Nota del alumno (0-100)
 *         observacion:
 *           type: string
 *           description: Observación opcional
 *     CalificacionResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id_aula:
 *           type: string
 *         id_alumno:
 *           type: object
 *         id_tipo_calificacion:
 *           type: object
 *         nota:
 *           type: number
 *         observacion:
 *           type: string
 *         registrado_por:
 *           type: object
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 *     RosterCalificaciones:
 *       type: object
 *       properties:
 *         aula:
 *           type: object
 *           description: Información del aula con curso, ciclo y profesor
 *         tipos_calificacion:
 *           type: array
 *           description: Tipos de calificación configurados para el aula
 *           items:
 *             type: object
 *         alumnos:
 *           type: array
 *           description: Lista de alumnos con sus calificaciones
 *           items:
 *             type: object
 *             properties:
 *               id_alumno:
 *                 type: string
 *               alumno:
 *                 type: object
 *               estado_inscripcion:
 *                 type: string
 *               calificaciones:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id_tipo_calificacion:
 *                       type: string
 *                     nombre_tipo:
 *                       type: string
 *                     porcentaje:
 *                       type: number
 *                     nota:
 *                       type: number
 *                       nullable: true
 *                     observacion:
 *                       type: string
 *               promedio_ponderado:
 *                 type: number
 *                 nullable: true
 *                 description: Promedio ponderado final (solo si tiene todas las notas)
 */

/**
 * @swagger
 * /calificaciones/roster/{id_aula}:
 *   get:
 *     summary: Obtiene el roster del aula con tipos de calificación y notas existentes
 *     description: Devuelve todos los alumnos del aula con sus calificaciones por tipo. Calcula automáticamente el promedio ponderado.
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: path
 *         name: id_aula
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Roster de calificaciones obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/RosterCalificaciones'
 *       400:
 *         description: El aula no tiene tipos de calificación configurados
 *       404:
 *         description: Aula no encontrada
 */
router.get('/roster/:id_aula', calificacionesController.getRosterDeAulaParaCalificaciones);

/**
 * @swagger
 * /calificaciones:
 *   post:
 *     summary: Registra calificaciones en lote
 *     description: Permite registrar múltiples calificaciones a la vez. Si ya existe una calificación, la actualiza.
 *     tags: [Calificaciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CalificacionItem'
 *               registrado_por:
 *                 type: string
 *                 description: ID del usuario que registra las calificaciones (opcional)
 *           example:
 *             items:
 *               - id_aula: "507f1f77bcf86cd799439011"
 *                 id_alumno: "507f1f77bcf86cd799439012"
 *                 id_tipo_calificacion: "507f1f77bcf86cd799439013"
 *                 nota: 85
 *                 observacion: "Excelente trabajo"
 *               - id_aula: "507f1f77bcf86cd799439011"
 *                 id_alumno: "507f1f77bcf86cd799439012"
 *                 id_tipo_calificacion: "507f1f77bcf86cd799439014"
 *                 nota: 90
 *             registrado_por: "507f1f77bcf86cd799439015"
 *     responses:
 *       200:
 *         description: Calificaciones registradas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     matched:
 *                       type: number
 *                       description: Número de registros que coincidieron
 *                     modified:
 *                       type: number
 *                       description: Número de registros modificados
 *                     upserts:
 *                       type: number
 *                       description: Número de registros insertados
 *                 message:
 *                   type: string
 *                   example: "Calificaciones registradas exitosamente"
 *       400:
 *         description: Error de validación (nota fuera de rango, tipo de calificación inválido, etc.)
 *       404:
 *         description: Tipo de calificación no encontrado
 */
router.post('/', calificacionesController.registrarCalificaciones);

/**
 * @swagger
 * /calificaciones/{id_aula}/alumno/{id_alumno}:
 *   get:
 *     summary: Obtiene las calificaciones de un alumno específico en un aula
 *     tags: [Calificaciones]
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
 *     responses:
 *       200:
 *         description: Calificaciones del alumno obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_alumno:
 *                       type: string
 *                     alumno:
 *                       type: object
 *                     calificaciones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CalificacionResponse'
 *                     promedio_ponderado:
 *                       type: number
 *                       nullable: true
 *                     completado:
 *                       type: boolean
 *                       description: Indica si el alumno tiene todas las calificaciones
 */
router.get('/:id_aula/alumno/:id_alumno', calificacionesController.getCalificacionesDeAlumno);

/**
 * @swagger
 * /calificaciones/resumen/{id_aula}:
 *   get:
 *     summary: Obtiene el resumen completo de calificaciones del aula con estadísticas
 *     description: Similar al roster pero incluye estadísticas generales del aula (promedio general, máximo, mínimo)
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: path
 *         name: id_aula
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Resumen de calificaciones con estadísticas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/RosterCalificaciones'
 *                     - type: object
 *                       properties:
 *                         estadisticas:
 *                           type: object
 *                           properties:
 *                             total_alumnos:
 *                               type: number
 *                             alumnos_con_promedio:
 *                               type: number
 *                             promedio_aula:
 *                               type: number
 *                               nullable: true
 *                             promedio_maximo:
 *                               type: number
 *                               nullable: true
 *                             promedio_minimo:
 *                               type: number
 *                               nullable: true
 */
router.get('/resumen/:id_aula', calificacionesController.getResumenCalificacionesAula);

/**
 * @swagger
 * /calificaciones/{id_aula}/alumno/{id_alumno}/tipo/{id_tipo_calificacion}:
 *   delete:
 *     summary: Elimina una calificación específica
 *     tags: [Calificaciones]
 *     parameters:
 *       - in: path
 *         name: id_aula
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: id_alumno
 *         schema:
 *           type: string
 *         required: true
 *       - in: path
 *         name: id_tipo_calificacion
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Calificación eliminada
 *       404:
 *         description: Calificación no encontrada
 */
router.delete('/:id_aula/alumno/:id_alumno/tipo/:id_tipo_calificacion', calificacionesController.deleteCalificacion);

module.exports = router;
