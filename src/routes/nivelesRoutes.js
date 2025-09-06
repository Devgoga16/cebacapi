const express = require('express');
const router = express.Router();
const nivelesController = require('../controllers/nivelesController');

/**
 * @swagger
 * tags:
 *   name: Niveles
 *   description: Endpoints para gestión de niveles
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Nivel:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nombre_nivel:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /niveles:
 *   get:
 *     summary: Obtiene todos los niveles
 *     tags: [Niveles]
 *     responses:
 *       200:
 *         description: Lista de niveles
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
 *                     $ref: '#/components/schemas/Nivel'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/niveles', nivelesController.getAllNiveles);

/**
 * @swagger
 * /niveles/{id}:
 *   get:
 *     summary: Obtiene un nivel por id
 *     tags: [Niveles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del nivel
 *     responses:
 *       200:
 *         description: Nivel encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Nivel'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Nivel no encontrado
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
router.get('/niveles/:id', nivelesController.getNivelById);

/**
 * @swagger
 * /niveles:
 *   post:
 *     summary: Crea un nuevo nivel
 *     tags: [Niveles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Nivel'
 *     responses:
 *       201:
 *         description: Nivel creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Nivel'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/niveles', nivelesController.createNivel);

/**
 * @swagger
 * /niveles/{id}:
 *   put:
 *     summary: Actualiza un nivel
 *     tags: [Niveles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del nivel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Nivel'
 *     responses:
 *       200:
 *         description: Nivel actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Nivel'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Nivel no encontrado
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
router.put('/niveles/:id', nivelesController.updateNivel);

/**
 * @swagger
 * /niveles/{id}:
 *   delete:
 *     summary: Elimina un nivel
 *     tags: [Niveles]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del nivel
 *     responses:
 *       200:
 *         description: Nivel eliminado
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
 *         description: Nivel no encontrado
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
router.delete('/niveles/:id', nivelesController.deleteNivel);

module.exports = router;
