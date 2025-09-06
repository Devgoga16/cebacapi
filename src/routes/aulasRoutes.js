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

module.exports = router;
