const express = require('express');
const router = express.Router();
const aulaalumnosController = require('../controllers/aulaalumnosController');

/**
 * @swagger
 * tags:
 *   name: AulaAlumnos
 *   description: Endpoints para gestión de AulaAlumnos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AulaAlumno:
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
 *         estado:
 *           type: string
 *           enum: [aprobado, reprobado, en curso]
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /aulaalumnos:
 *   get:
 *     summary: Obtiene todos los AulaAlumnos
 *     tags: [AulaAlumnos]
 *     responses:
 *       200:
 *         description: Lista de AulaAlumnos
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
 *                     $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/aulaalumnos', aulaalumnosController.getAllAulaAlumnos);

/**
 * @swagger
 * /aulaalumnos/{id}:
 *   get:
 *     summary: Obtiene un AulaAlumno por id
 *     tags: [AulaAlumnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de AulaAlumno
 *     responses:
 *       200:
 *         description: AulaAlumno encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: AulaAlumno no encontrado
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
router.get('/aulaalumnos/:id', aulaalumnosController.getAulaAlumnoById);

/**
 * @swagger
 * /aulaalumnos:
 *   post:
 *     summary: Crea un nuevo AulaAlumno
 *     tags: [AulaAlumnos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AulaAlumno'
 *     responses:
 *       201:
 *         description: AulaAlumno creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/aulaalumnos', aulaalumnosController.createAulaAlumno);

/**
 * @swagger
 * /aulaalumnos/{id}:
 *   put:
 *     summary: Actualiza un AulaAlumno
 *     tags: [AulaAlumnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de AulaAlumno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AulaAlumno'
 *     responses:
 *       200:
 *         description: AulaAlumno actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: AulaAlumno no encontrado
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
router.put('/aulaalumnos/:id', aulaalumnosController.updateAulaAlumno);

/**
 * @swagger
 * /aulaalumnos/{id}:
 *   delete:
 *     summary: Elimina un AulaAlumno
 *     tags: [AulaAlumnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de AulaAlumno
 *     responses:
 *       200:
 *         description: AulaAlumno eliminado
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
 *         description: AulaAlumno no encontrado
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
router.delete('/aulaalumnos/:id', aulaalumnosController.deleteAulaAlumno);

module.exports = router;
