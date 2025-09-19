const express = require('express');
const router = express.Router();
const inscripcionesController = require('../controllers/inscripcionesController');

/**
 * @swagger
 * tags:
 *   name: Inscripciones
 *   description: Endpoints para gestión de inscripciones
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Inscripcion:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id_aula:
 *           type: string
 *           description: ID del aula (ObjectId)
 *         id_alumno:
 *           type: string
 *           description: ID del alumno (ObjectId)
 *         fecha_inscripcion:
 *           type: string
 *           format: date
 *         estado:
 *           type: string
 *           enum: [Pendiente, Aceptado, Rechazado]
 *         observacion:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /inscripciones:
 *   get:
 *     summary: Obtiene todas las inscripciones
 *     tags: [Inscripciones]
 *     responses:
 *       200:
 *         description: Lista de inscripciones
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
 *                     $ref: '#/components/schemas/Inscripcion'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/inscripciones', inscripcionesController.getAllInscripciones);

/**
 * @swagger
 * /inscripciones/aulas-disponibles:
 *   get:
 *     summary: Lista el ciclo con inscripciones abiertas y agrupa aulas por nivel y curso
 *     tags: [Inscripciones]
 *     responses:
 *       200:
 *         description: Ciclo con inscripciones abiertas y aulas agrupadas
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
 *                       description: Ciclo con inscripcionesabiertas=true (o null si no hay)
 *                     niveles:
 *                       type: array
 *                       description: Agrupación por nivel
 *                       items:
 *                         type: object
 *                         properties:
 *                           nivel:
 *                             type: object
 *                             description: Documento de nivel
 *                           cursos:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 curso:
 *                                   type: object
 *                                   description: Documento de curso con prerequisitos poblados
 *                                 aulas:
 *                                   type: array
 *                                   description: Aulas disponibles para ese curso
 *                                   items:
 *                                     type: object
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/inscripciones/aulas-disponibles', inscripcionesController.getAulasDisponibles);

/**
 * @swagger
 * /inscripciones/{id}:
 *   get:
 *     summary: Obtiene una inscripción por id
 *     tags: [Inscripciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la inscripción
 *     responses:
 *       200:
 *         description: Inscripción encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Inscripcion'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Inscripción no encontrada
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
router.get('/inscripciones/:id', inscripcionesController.getInscripcionById);

/**
 * @swagger
 * /inscripciones:
 *   post:
 *     summary: Crea una nueva inscripción
 *     tags: [Inscripciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Inscripcion'
 *     responses:
 *       201:
 *         description: Inscripción creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Inscripcion'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/inscripciones', inscripcionesController.createInscripcion);

/**
 * @swagger
 * /inscripciones/{id}:
 *   put:
 *     summary: Actualiza una inscripción
 *     tags: [Inscripciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la inscripción
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Inscripcion'
 *     responses:
 *       200:
 *         description: Inscripción actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Inscripcion'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Inscripción no encontrada
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
router.put('/inscripciones/:id', inscripcionesController.updateInscripcion);

/**
 * @swagger
 * /inscripciones/{id}:
 *   delete:
 *     summary: Elimina una inscripción
 *     tags: [Inscripciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la inscripción
 *     responses:
 *       200:
 *         description: Inscripción eliminada
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
 *         description: Inscripción no encontrada
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
router.delete('/inscripciones/:id', inscripcionesController.deleteInscripcion);

/**
 * @swagger
 * /inscripciones/{id}/aprobar:
 *   post:
 *     summary: Aprueba una inscripción (crea AulaAlumno y marca estado=Aceptado)
 *     tags: [Inscripciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la inscripción
 *     responses:
 *       200:
 *         description: Inscripción aprobada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Inscripcion'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/inscripciones/:id/aprobar', inscripcionesController.aprobarInscripcion);

/**
 * @swagger
 * /inscripciones/{id}/rechazar:
 *   post:
 *     summary: Rechaza una inscripción (actualiza estado=Rechazado)
 *     tags: [Inscripciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la inscripción
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               observacion:
 *                 type: string
 *                 description: Motivo del rechazo
 *     responses:
 *       200:
 *         description: Inscripción rechazada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Inscripcion'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/inscripciones/:id/rechazar', inscripcionesController.rechazarInscripcion);
module.exports = router;
