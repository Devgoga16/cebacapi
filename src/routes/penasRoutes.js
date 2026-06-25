const express = require('express');
const router = express.Router();
const penasController = require('../controllers/penasController');

/**
 * @swagger
 * tags:
 *   name: Peñas
 *   description: Calificación por lección/sección de manuales (peñas), independiente de Calificaciones
 */

/**
 * @swagger
 * /penas/{idAula}/lecciones:
 *   get:
 *     summary: Lista las lecciones que ya tienen notas registradas en un aula
 *     tags: [Peñas]
 *     parameters:
 *       - in: path
 *         name: idAula
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de lecciones registradas
 */
router.get('/:idAula/lecciones', penasController.getLeccionesRegistradas);

/**
 * @swagger
 * /penas/{idAula}/roster:
 *   get:
 *     summary: Obtiene el roster de alumnos de un aula con sus notas de peña para una lección
 *     tags: [Peñas]
 *     parameters:
 *       - in: path
 *         name: idAula
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: leccion
 *         schema:
 *           type: string
 *         description: Lección a consultar (si se omite, no se incluyen notas)
 *     responses:
 *       200:
 *         description: Roster con notas por sección
 */
router.get('/:idAula/roster', penasController.getRosterPena);

/**
 * @swagger
 * /penas/{idAula}/leccion/{leccion}:
 *   post:
 *     summary: Registra/actualiza en lote las notas de una lección de peña
 *     tags: [Peñas]
 *     parameters:
 *       - in: path
 *         name: idAula
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: leccion
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [id_alumno, seccion, nota]
 *                   properties:
 *                     id_alumno:
 *                       type: string
 *                     seccion:
 *                       type: string
 *                       example: "A"
 *                     nota:
 *                       type: number
 *                       example: 18
 *                     comentario:
 *                       type: string
 *               registrado_por:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notas registradas correctamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Aula no encontrada
 */
router.post('/:idAula/leccion/:leccion', penasController.guardarNotasPena);

/**
 * @swagger
 * /penas/{idAula}/leccion/{leccion}:
 *   delete:
 *     summary: Elimina una lección completa de un aula, junto con todas las notas de sus secciones
 *     tags: [Peñas]
 *     parameters:
 *       - in: path
 *         name: idAula
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: leccion
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lección eliminada
 */
router.delete('/:idAula/leccion/:leccion', penasController.eliminarLeccion);

/**
 * @swagger
 * /penas/{idAula}/leccion/{leccion}/seccion/{seccion}:
 *   delete:
 *     summary: Elimina una sección de una lección, junto con las notas registradas en ella
 *     tags: [Peñas]
 *     parameters:
 *       - in: path
 *         name: idAula
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: leccion
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: seccion
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sección eliminada
 */
router.delete('/:idAula/leccion/:leccion/seccion/:seccion', penasController.eliminarSeccion);

module.exports = router;
