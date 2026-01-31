const express = require('express');
const router = express.Router();
const anunciosProfesorController = require('../controllers/anunciosProfesorController');

/**
 * @swagger
 * tags:
 *   name: Anuncios Profesor
 *   description: Endpoints para gestión de anuncios por aula creados por profesores
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AnuncioProfesor:
 *       type: object
 *       required:
 *         - id_profesor
 *         - id_aula
 *         - titulo
 *         - descripcion
 *       properties:
 *         id_profesor:
 *           type: string
 *           description: ID del profesor que crea el anuncio
 *         id_aula:
 *           type: string
 *           description: ID del aula donde se publica el anuncio
 *         titulo:
 *           type: string
 *           description: Título del anuncio
 *         descripcion:
 *           type: string
 *           description: Descripción o contenido del anuncio
 *         color:
 *           type: string
 *           description: Color para visualización (formato hexadecimal)
 *           default: "#3B82F6"
 *         fecha_publicacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de publicación del anuncio
 *     AnuncioProfesorResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id_profesor:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             nombres:
 *               type: string
 *             apellido_paterno:
 *               type: string
 *             apellido_materno:
 *               type: string
 *         id_aula:
 *           type: object
 *         titulo:
 *           type: string
 *         descripcion:
 *           type: string
 *         color:
 *           type: string
 *         fecha_publicacion:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /anuncios-profesor:
 *   post:
 *     summary: Crea un nuevo anuncio para un aula
 *     tags: [Anuncios Profesor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnuncioProfesor'
 *           example:
 *             id_profesor: "507f1f77bcf86cd799439011"
 *             id_aula: "507f1f77bcf86cd799439012"
 *             titulo: "Clase suspendida mañana"
 *             descripcion: "La clase del día de mañana será suspendida por motivos personales. Nos vemos la próxima semana."
 *             color: "#EF4444"
 *             fecha_publicacion: "2026-01-30T10:00:00Z"
 *     responses:
 *       201:
 *         description: Anuncio creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/AnuncioProfesorResponse'
 *                 message:
 *                   type: string
 *                   example: "Anuncio creado exitosamente"
 *       403:
 *         description: El profesor no está asignado a esta aula
 *       404:
 *         description: Profesor o aula no encontrados
 */
router.post('/', anunciosProfesorController.createAnuncio);

/**
 * @swagger
 * /anuncios-profesor/aula/{id_aula}:
 *   get:
 *     summary: Obtiene todos los anuncios de un aula
 *     tags: [Anuncios Profesor]
 *     parameters:
 *       - in: path
 *         name: id_aula
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Lista de anuncios del aula
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AnuncioProfesorResponse'
 */
router.get('/aula/:id_aula', anunciosProfesorController.getAnunciosByAula);

/**
 * @swagger
 * /anuncios-profesor/profesor/{id_profesor}:
 *   get:
 *     summary: Obtiene todos los anuncios creados por un profesor
 *     tags: [Anuncios Profesor]
 *     parameters:
 *       - in: path
 *         name: id_profesor
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del profesor
 *     responses:
 *       200:
 *         description: Lista de anuncios del profesor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AnuncioProfesorResponse'
 */
router.get('/profesor/:id_profesor', anunciosProfesorController.getAnunciosByProfesor);

/**
 * @swagger
 * /anuncios-profesor/profesor/{id_profesor}/recientes:
 *   get:
 *     summary: Obtiene los anuncios más recientes de un profesor
 *     tags: [Anuncios Profesor]
 *     parameters:
 *       - in: path
 *         name: id_profesor
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del profesor
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad máxima de anuncios a retornar
 *     responses:
 *       200:
 *         description: Lista de anuncios recientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AnuncioProfesorResponse'
 */
router.get('/profesor/:id_profesor/recientes', anunciosProfesorController.getAnunciosRecientesByProfesor);

/**
 * @swagger
 * /anuncios-profesor/{id}:
 *   get:
 *     summary: Obtiene un anuncio específico por ID
 *     tags: [Anuncios Profesor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/AnuncioProfesorResponse'
 *       404:
 *         description: Anuncio no encontrado
 */
router.get('/:id', anunciosProfesorController.getAnuncioById);

/**
 * @swagger
 * /anuncios-profesor/{id}:
 *   put:
 *     summary: Actualiza un anuncio existente
 *     tags: [Anuncios Profesor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del anuncio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               color:
 *                 type: string
 *               fecha_publicacion:
 *                 type: string
 *                 format: date-time
 *           example:
 *             titulo: "Clase reprogramada"
 *             descripcion: "La clase será el próximo martes a las 3 PM"
 *             color: "#10B981"
 *     responses:
 *       200:
 *         description: Anuncio actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/AnuncioProfesorResponse'
 *                 message:
 *                   type: string
 *                   example: "Anuncio actualizado exitosamente"
 *       404:
 *         description: Anuncio no encontrado
 */
router.put('/:id', anunciosProfesorController.updateAnuncio);

/**
 * @swagger
 * /anuncios-profesor/{id}:
 *   delete:
 *     summary: Elimina un anuncio
 *     tags: [Anuncios Profesor]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del anuncio
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_profesor:
 *                 type: string
 *                 description: ID del profesor (para validación de seguridad)
 *     responses:
 *       200:
 *         description: Anuncio eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Anuncio eliminado exitosamente"
 *       403:
 *         description: No tienes permiso para eliminar este anuncio
 *       404:
 *         description: Anuncio no encontrado
 */
router.delete('/:id', anunciosProfesorController.deleteAnuncio);

module.exports = router;
