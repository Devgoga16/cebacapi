const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reaccionesController');

/**
 * @swagger
 * tags:
 *   name: Reacciones
 *   description: Reacciones de usuarios sobre anuncios (me_gusta, me_encanta, me_asombra, me_bendice)
 */

/**
 * @swagger
 * /reacciones:
 *   post:
 *     summary: Crea, actualiza o quita (toggle) la reacción de un usuario sobre un anuncio
 *     tags: [Reacciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tipo_entidad, id_anuncio, id_usuario, reaccion]
 *             properties:
 *               tipo_entidad:
 *                 type: string
 *                 enum: [AnuncioProfesor, Anuncio]
 *               id_anuncio: { type: string }
 *               id_usuario: { type: string }
 *               reaccion:
 *                 type: string
 *                 enum: [me_gusta, me_encanta, me_asombra, me_bendice]
 *     responses:
 *       200:
 *         description: Reacción creada, actualizada o eliminada (toggle)
 *       400:
 *         description: Datos faltantes o reacción inválida
 */
router.post('/', ctrl.reaccionar);

/**
 * @swagger
 * /reacciones/{tipo_entidad}/{id_anuncio}/resumen:
 *   get:
 *     summary: Resumen de reacciones de un anuncio (conteo por tipo + mi reacción)
 *     tags: [Reacciones]
 *     parameters:
 *       - in: path
 *         name: tipo_entidad
 *         required: true
 *         schema: { type: string, enum: [AnuncioProfesor, Anuncio] }
 *       - in: path
 *         name: id_anuncio
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: id_usuario
 *         schema: { type: string }
 *         description: Si se indica, devuelve también la reacción de ese usuario en "mi_reaccion"
 *     responses:
 *       200:
 *         description: "{ total, conteos: { me_gusta, me_encanta, me_asombra, me_bendice }, mi_reaccion }"
 */
router.get('/:tipo_entidad/:id_anuncio/resumen', ctrl.getResumen);

/**
 * @swagger
 * /reacciones/{tipo_entidad}/{id_anuncio}/detalle:
 *   get:
 *     summary: Lista quién reaccionó y con qué reacción
 *     tags: [Reacciones]
 *     parameters:
 *       - in: path
 *         name: tipo_entidad
 *         required: true
 *         schema: { type: string, enum: [AnuncioProfesor, Anuncio] }
 *       - in: path
 *         name: id_anuncio
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de reacciones con la persona que reaccionó
 */
router.get('/:tipo_entidad/:id_anuncio/detalle', ctrl.getDetalle);

/**
 * @swagger
 * /reacciones/{tipo_entidad}/{id_anuncio}/{id_usuario}:
 *   delete:
 *     summary: Quita explícitamente la reacción de un usuario sobre un anuncio
 *     tags: [Reacciones]
 *     parameters:
 *       - in: path
 *         name: tipo_entidad
 *         required: true
 *         schema: { type: string, enum: [AnuncioProfesor, Anuncio] }
 *       - in: path
 *         name: id_anuncio
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: id_usuario
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ eliminada: boolean }"
 */
router.delete('/:tipo_entidad/:id_anuncio/:id_usuario', ctrl.quitarReaccion);

module.exports = router;
