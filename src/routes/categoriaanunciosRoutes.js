const express = require('express');
const router = express.Router();
const categoriaanunciosController = require('../controllers/categoriaanunciosController');

/**
 * @swagger
 * tags:
 *   name: CategoriaAnuncios
 *   description: Endpoints para gestión de categorías de anuncios
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoriaAnuncio:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nombre_categoria:
 *           type: string
 *         icono:
 *           type: string
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /categoriaanuncios:
 *   get:
 *     summary: Obtiene todas las categorías de anuncios
 *     tags: [CategoriaAnuncios]
 *     responses:
 *       200:
 *         description: Lista de categorías
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
 *                     $ref: '#/components/schemas/CategoriaAnuncio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/categoriaanuncios', categoriaanunciosController.getAllCategoriaAnuncios);

/**
 * @swagger
 * /categoriaanuncios/{id}:
 *   get:
 *     summary: Obtiene una categoría por id
 *     tags: [CategoriaAnuncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CategoriaAnuncio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Categoría no encontrada
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
router.get('/categoriaanuncios/:id', categoriaanunciosController.getCategoriaAnuncioById);

/**
 * @swagger
 * /categoriaanuncios:
 *   post:
 *     summary: Crea una nueva categoría
 *     tags: [CategoriaAnuncios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoriaAnuncio'
 *     responses:
 *       201:
 *         description: Categoría creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CategoriaAnuncio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/categoriaanuncios', categoriaanunciosController.createCategoriaAnuncio);

/**
 * @swagger
 * /categoriaanuncios/{id}:
 *   put:
 *     summary: Actualiza una categoría
 *     tags: [CategoriaAnuncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoriaAnuncio'
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CategoriaAnuncio'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Categoría no encontrada
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
router.put('/categoriaanuncios/:id', categoriaanunciosController.updateCategoriaAnuncio);

/**
 * @swagger
 * /categoriaanuncios/{id}:
 *   delete:
 *     summary: Elimina una categoría
 *     tags: [CategoriaAnuncios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría eliminada
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
 *         description: Categoría no encontrada
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
router.delete('/categoriaanuncios/:id', categoriaanunciosController.deleteCategoriaAnuncio);

module.exports = router;
