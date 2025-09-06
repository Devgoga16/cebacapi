const express = require('express');
const router = express.Router();
const anunciosController = require('../controllers/anunciosController');

/**
 * @swagger
 * tags:
 *   name: Anuncios
 *   description: Endpoints para gestión de anuncios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Anuncio:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id_categoria_anuncio:
 *           type: string
 *           description: ID de la categoría (ObjectId)
 *         titulo:
 *           type: string
 *         mensaje:
 *           type: string
 *         color:
 *           type: string
 *         to_link:
 *           type: string
 *         fecha_caducidad:
 *           type: string
 *           format: date
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             description: ID de rol (ObjectId)
 *         id_publicador:
 *           type: string
 *           description: ID del usuario (ObjectId)
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /anuncios:
 *   get:
 *     summary: Obtiene todos los anuncios
 *     tags: [Anuncios]
 *     responses:
 *       200:
 *         description: Lista de anuncios
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
 *                     $ref: '#/components/schemas/Anuncio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/anuncios', anunciosController.getAllAnuncios);

/**
 * @swagger
 * /anuncios/{id}:
 *   get:
 *     summary: Obtiene un anuncio por id
 *     tags: [Anuncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del anuncio
 *     responses:
 *       200:
 *         description: Anuncio encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Anuncio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Anuncio no encontrado
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
router.get('/anuncios/:id', anunciosController.getAnuncioById);

/**
 * @swagger
 * /anuncios:
 *   post:
 *     summary: Crea un nuevo anuncio
 *     tags: [Anuncios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Anuncio'
 *     responses:
 *       201:
 *         description: Anuncio creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Anuncio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/anuncios', anunciosController.createAnuncio);

/**
 * @swagger
 * /anuncios/{id}:
 *   put:
 *     summary: Actualiza un anuncio
 *     tags: [Anuncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del anuncio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Anuncio'
 *     responses:
 *       200:
 *         description: Anuncio actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Anuncio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Anuncio no encontrado
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
router.put('/anuncios/:id', anunciosController.updateAnuncio);

/**
 * @swagger
 * /anuncios/{id}:
 *   delete:
 *     summary: Elimina un anuncio
 *     tags: [Anuncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del anuncio
 *     responses:
 *       200:
 *         description: Anuncio eliminado
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
 *         description: Anuncio no encontrado
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
router.delete('/anuncios/:id', anunciosController.deleteAnuncio);

module.exports = router;
