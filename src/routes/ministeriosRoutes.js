const express = require('express');
const router = express.Router();
const ministeriosController = require('../controllers/ministeriosController');

/**
 * @swagger
 * tags:
 *   name: Ministerios
 *   description: Endpoints para gestión de ministerios
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Ministerio:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nombre_encargado:
 *           type: string
 *         nombre_ministerio:
 *           type: string
 *         id_iglesia:
 *           type: string
 *           description: ID de la iglesia (ObjectId)
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */
/**
 * @swagger
 * /ministerios:
 *   get:
 *     summary: Obtiene todos los ministerios
 *     tags: [Ministerios]
 *     responses:
 *       200:
 *         description: Lista de ministerios
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
 *                     $ref: '#/components/schemas/Ministerio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/ministerios', ministeriosController.getAllMinisterios);
/**
 * @swagger
 * /ministerios/{id}:
 *   get:
 *     summary: Obtiene un ministerio por id
 *     tags: [Ministerios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ministerio
 *     responses:
 *       200:
 *         description: Ministerio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ministerio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Ministerio no encontrado
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
router.get('/ministerios/:id', ministeriosController.getMinisterioById);
/**
 * @swagger
 * /ministeriosbyiglesia/{id}:
 *   get:
 *     summary: Obtiene todos los ministerios de una iglesia
 *     tags: [Ministerios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la iglesia
 *     responses:
 *       200:
 *         description: Ministerio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ministerio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Ministerio no encontrado
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
router.get('/ministeriosbyiglesia/:id', ministeriosController.getMinisteriosByIglesia);
/**
 * @swagger
 * /ministerios:
 *   post:
 *     summary: Crea un nuevo ministerio
 *     tags: [Ministerios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ministerio'
 *     responses:
 *       201:
 *         description: Ministerio creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ministerio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/ministerios', ministeriosController.createMinisterio);
/**
 * @swagger
 * /ministerios/{id}:
 *   put:
 *     summary: Actualiza un ministerio
 *     tags: [Ministerios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ministerio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ministerio'
 *     responses:
 *       200:
 *         description: Ministerio actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Ministerio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Ministerio no encontrado
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
router.put('/ministerios/:id', ministeriosController.updateMinisterio);
/**
 * @swagger
 * /ministerios/{id}:
 *   delete:
 *     summary: Elimina un ministerio
 *     tags: [Ministerios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ministerio
 *     responses:
 *       200:
 *         description: Ministerio eliminado
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
 *         description: Ministerio no encontrado
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
router.delete('/ministerios/:id', ministeriosController.deleteMinisterio);

module.exports = router;
