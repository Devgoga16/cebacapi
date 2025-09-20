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
