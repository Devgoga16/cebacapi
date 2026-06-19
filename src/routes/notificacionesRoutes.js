const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificacionesController');

/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Notificaciones in-app por usuario con confirmación de lectura
 */

/**
 * @swagger
 * /notificaciones/{id_usuario}:
 *   get:
 *     summary: Lista las notificaciones de un usuario
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: path
 *         name: id_usuario
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: leido
 *         schema: { type: boolean }
 *         description: Filtra por leídas (true) o no leídas (false)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Lista de notificaciones con metadatos de paginación y conteo de no leídas
 */
router.get('/:id_usuario', ctrl.getNotificacionesPorUsuario);

/**
 * @swagger
 * /notificaciones/{id_usuario}/no-leidas/count:
 *   get:
 *     summary: Cuenta las notificaciones no leídas de un usuario (para el badge)
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: path
 *         name: id_usuario
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ no_leidas: number }"
 */
router.get('/:id_usuario/no-leidas/count', ctrl.contarNoLeidas);

/**
 * @swagger
 * /notificaciones/{id}/leer:
 *   patch:
 *     summary: Marca una notificación específica como leída
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notificación actualizada
 *       404:
 *         description: Notificación no encontrada
 */
router.patch('/:id/leer', ctrl.marcarLeida);

/**
 * @swagger
 * /notificaciones/{id_usuario}/leer-todas:
 *   patch:
 *     summary: Marca todas las notificaciones de un usuario como leídas
 *     tags: [Notificaciones]
 *     parameters:
 *       - in: path
 *         name: id_usuario
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: "{ modificadas: number }"
 */
router.patch('/:id_usuario/leer-todas', ctrl.marcarTodasLeidas);

module.exports = router;
