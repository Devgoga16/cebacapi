const express = require('express');
const router = express.Router();
const ciclosController = require('../controllers/ciclosController');

/**
 * @swagger
 * tags:
 *   name: Ciclos
 *   description: Endpoints para gestión de ciclos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Ciclo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nombre_ciclo:
 *           type: string
 *         fecha_inicio:
 *           type: string
 *           format: date
 *         fecha_fin:
 *           type: string
 *           format: date
 *         actual:
 *           type: boolean
 *         inscripcionesabiertas:
 *           type: boolean
 *           description: Indica si las inscripciones están abiertas para este ciclo
 *         año:
 *           type: number
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /ciclos:
 *   get:
 *     summary: Obtiene todos los ciclos
 *     tags: [Ciclos]
 *     responses:
 *       200:
 *         description: Lista de ciclos
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
 *                     $ref: '#/components/schemas/Ciclo'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/ciclos', ciclosController.getAllCiclos);

/**
 * @swagger
 * /ciclos/{id}:
 *   get:
 *     summary: Obtiene un ciclo por id
 *     tags: [Ciclos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ciclo
 *     responses:
 *       200:
 *         description: Ciclo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ciclo'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Ciclo no encontrado
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
router.get('/ciclos/:id', ciclosController.getCicloById);

/**
 * @swagger
 * /ciclos:
 *   post:
 *     summary: Crea un nuevo ciclo
 *     tags: [Ciclos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ciclo'
 *     responses:
 *       201:
 *         description: Ciclo creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ciclo'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/ciclos', ciclosController.createCiclo);

/**
 * @swagger
 * /ciclos/{id}:
 *   put:
 *     summary: Actualiza un ciclo
 *     tags: [Ciclos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ciclo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ciclo'
 *     responses:
 *       200:
 *         description: Ciclo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ciclo'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Ciclo no encontrado
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
router.put('/ciclos/:id', ciclosController.updateCiclo);

/**
 * @swagger
 * /ciclos/{id}:
 *   delete:
 *     summary: Elimina un ciclo
 *     tags: [Ciclos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ciclo
 *     responses:
 *       200:
 *         description: Ciclo eliminado
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
 *         description: Ciclo no encontrado
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
router.delete('/ciclos/:id', ciclosController.deleteCiclo);

module.exports = router;
