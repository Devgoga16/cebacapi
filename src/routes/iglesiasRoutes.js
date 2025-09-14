const express = require('express');
const router = express.Router();
const iglesiasController = require('../controllers/iglesiasController');

/**
 * @swagger
 * tags:
 *   name: Iglesias
 *   description: Endpoints para gestión de iglesias
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Iglesia:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nombre_iglesia:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */
/**
 * @swagger
 * /iglesias:
 *   get:
 *     summary: Obtiene todas las iglesias
 *     tags: [Iglesias]
 *     responses:
 *       200:
 *         description: Lista de iglesias
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
 *                     $ref: '#/components/schemas/Iglesia'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/iglesias', iglesiasController.getAllIglesias);
/**
 * @swagger
 * /iglesias/con-ministerios:
 *   get:
 *     summary: Obtiene todas las iglesias con sus ministerios asociados
 *     tags: [Iglesias]
 *     responses:
 *       200:
 *         description: Lista de iglesias con su arreglo de ministerios
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
 *                       _id:
 *                         type: string
 *                       nombre_iglesia:
 *                         type: string
 *                       ministerios:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             nombre_ministerio:
 *                               type: string
 *                             nombre_encargado:
 *                               type: string
 *                             id_iglesia:
 *                               type: string
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/iglesias/con-ministerios', iglesiasController.getIglesiasConMinisterios);
/**
 * @swagger
 * /iglesias/{id}:
 *   get:
 *     summary: Obtiene una iglesia por id
 *     tags: [Iglesias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la iglesia
 *     responses:
 *       200:
 *         description: Iglesia encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Iglesia'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Iglesia no encontrada
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
router.get('/iglesias/:id', iglesiasController.getIglesiaById);
/**
 * @swagger
 * /iglesias:
 *   post:
 *     summary: Crea una nueva iglesia
 *     tags: [Iglesias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Iglesia'
 *     responses:
 *       201:
 *         description: Iglesia creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Iglesia'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/iglesias', iglesiasController.createIglesia);
/**
 * @swagger
 * /iglesias/{id}:
 *   put:
 *     summary: Actualiza una iglesia
 *     tags: [Iglesias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la iglesia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Iglesia'
 *     responses:
 *       200:
 *         description: Iglesia actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Iglesia'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Iglesia no encontrada
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
router.put('/iglesias/:id', iglesiasController.updateIglesia);
/**
 * @swagger
 * /iglesias/{id}:
 *   delete:
 *     summary: Elimina una iglesia
 *     tags: [Iglesias]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la iglesia
 *     responses:
 *       200:
 *         description: Iglesia eliminada
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
 *         description: Iglesia no encontrada
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
router.delete('/iglesias/:id', iglesiasController.deleteIglesia);

module.exports = router;
