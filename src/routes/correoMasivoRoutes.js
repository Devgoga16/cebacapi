const express = require('express');
const router = express.Router();
const correoMasivoController = require('../controllers/correoMasivoController');

/**
 * @swagger
 * tags:
 *   name: Correo Masivo
 *   description: Envío de correos masivos a todas las personas o a una dirección específica
 */

/**
 * @swagger
 * /correos/masivo/todos:
 *   post:
 *     summary: Envía un correo a todas las personas registradas con email
 *     tags: [Correo Masivo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, texto]
 *             properties:
 *               titulo:
 *                 type: string
 *               texto:
 *                 type: string
 *     responses:
 *       200:
 *         description: Correo enviado
 *       400:
 *         description: Faltan campos requeridos
 */
router.post('/masivo/todos', correoMasivoController.enviarATodos);

/**
 * @swagger
 * /correos/masivo/todos/stream:
 *   post:
 *     summary: Envía un correo a todas las personas registradas, uno por uno, reportando el avance como NDJSON
 *     tags: [Correo Masivo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, texto]
 *             properties:
 *               titulo:
 *                 type: string
 *               texto:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stream NDJSON con eventos de progreso
 *       400:
 *         description: Faltan campos requeridos
 */
router.post('/masivo/todos/stream', correoMasivoController.enviarATodosStream);

/**
 * @swagger
 * /correos/masivo/individual:
 *   post:
 *     summary: Envía un correo a una dirección específica
 *     tags: [Correo Masivo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, texto, email]
 *             properties:
 *               titulo:
 *                 type: string
 *               texto:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Correo enviado
 *       400:
 *         description: Faltan campos requeridos o el correo es inválido
 */
router.post('/masivo/individual', correoMasivoController.enviarAUno);

module.exports = router;
