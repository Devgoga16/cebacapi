const express = require('express');
const router = express.Router();
const tiposCalificacionController = require('../controllers/tiposCalificacionController');

/**
 * @swagger
 * tags:
 *   name: Tipos de Calificación
 *   description: Endpoints para gestión de tipos de calificación por aula
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TipoCalificacion:
 *       type: object
 *       required:
 *         - nombre
 *         - porcentaje
 *       properties:
 *         nombre:
 *           type: string
 *           description: Nombre del tipo de calificación
 *           example: "Tarea 1"
 *         porcentaje:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Porcentaje de ponderación (debe sumar 100% con los demás tipos)
 *           example: 30
 *         descripcion:
 *           type: string
 *           description: Descripción opcional del tipo de calificación
 *           example: "Primera tarea del curso"
 *         orden:
 *           type: number
 *           description: Orden de visualización
 *           example: 0
 *     TipoCalificacionResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del tipo de calificación
 *         id_aula:
 *           type: string
 *           description: ID del aula al que pertenece
 *         nombre:
 *           type: string
 *         porcentaje:
 *           type: number
 *         descripcion:
 *           type: string
 *         orden:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /tipos-calificacion/{idAula}:
 *   post:
 *     summary: Configura los tipos de calificación para un aula
 *     description: Crea o reemplaza los tipos de calificación de un aula. Los porcentajes deben sumar exactamente 100%.
 *     tags: [Tipos de Calificación]
 *     parameters:
 *       - in: path
 *         name: idAula
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del aula
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipos
 *             properties:
 *               tipos:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/TipoCalificacion'
 *           example:
 *             tipos:
 *               - nombre: "Tarea 1"
 *                 porcentaje: 30
 *                 descripcion: "Primera tarea del curso"
 *               - nombre: "Tarea 2"
 *                 porcentaje: 40
 *                 descripcion: "Segunda tarea del curso"
 *               - nombre: "Asistencia"
 *                 porcentaje: 20
 *               - nombre: "Obra práctica"
 *                 porcentaje: 10
 *     responses:
 *       201:
 *         description: Tipos de calificación configurados exitosamente
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
 *                     $ref: '#/components/schemas/TipoCalificacionResponse'
 *                 message:
 *                   type: string
 *                   example: "Tipos de calificación configurados exitosamente"
 *       400:
 *         description: Error de validación (porcentajes no suman 100%, nombres duplicados, etc.)
 *       404:
 *         description: Aula no encontrada
 */
router.post('/:idAula', tiposCalificacionController.setTiposCalificacion);

/**
 * @swagger
 * /tipos-calificacion/{idAula}:
 *   get:
 *     summary: Obtiene los tipos de calificación de un aula
 *     tags: [Tipos de Calificación]
 *     parameters:
 *       - in: path
 *         name: idAula
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Lista de tipos de calificación del aula
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
 *                     $ref: '#/components/schemas/TipoCalificacionResponse'
 */
router.get('/:idAula', tiposCalificacionController.getTiposCalificacionByAula);

/**
 * @swagger
 * /tipos-calificacion/{idAula}:
 *   delete:
 *     summary: Elimina todos los tipos de calificación de un aula
 *     tags: [Tipos de Calificación]
 *     parameters:
 *       - in: path
 *         name: idAula
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Tipos de calificación eliminados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: number
 *                       example: 4
 *                 message:
 *                   type: string
 *                   example: "Tipos de calificación eliminados"
 */
router.delete('/:idAula', tiposCalificacionController.deleteTiposCalificacionByAula);

/**
 * @swagger
 * /tipos-calificacion/tipo/{idTipo}:
 *   put:
 *     summary: Actualiza un tipo de calificación específico
 *     description: Actualiza un tipo de calificación. Si se modifica el porcentaje, valida que el total siga sumando 100%.
 *     tags: [Tipos de Calificación]
 *     parameters:
 *       - in: path
 *         name: idTipo
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del tipo de calificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               porcentaje:
 *                 type: number
 *               descripcion:
 *                 type: string
 *               orden:
 *                 type: number
 *           example:
 *             nombre: "Tarea 1 - Actualizada"
 *             porcentaje: 35
 *     responses:
 *       200:
 *         description: Tipo de calificación actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/TipoCalificacionResponse'
 *                 message:
 *                   type: string
 *                   example: "Tipo de calificación actualizado"
 *       400:
 *         description: Los porcentajes no suman 100%
 *       404:
 *         description: Tipo de calificación no encontrado
 */
router.put('/tipo/:idTipo', tiposCalificacionController.updateTipoCalificacion);

module.exports = router;
