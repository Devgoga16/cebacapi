const express = require('express');
const ctrl = require('../controllers/requerimientosAulaController');
const router = express.Router();

/**
 * @swagger
 * /requerimientos-aula:
 *   get:
 *     summary: Listar todos los requerimientos
 *     tags: [RequerimientosAula]
 *     responses:
 *       200:
 *         description: Lista de todos los requerimientos obtenida exitosamente
 *   post:
 *     summary: Crear un nuevo requerimiento de aula
 *     tags: [RequerimientosAula]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_aula
 *               - id_persona
 *               - nombre
 *               - descripcion
 *               - fecha
 *             properties:
 *               id_aula: { type: string, description: "ID del aula" }
 *               id_persona: { type: string, description: "ID de la persona que solicita" }
 *               nombre: { type: string, description: "Nombre del requerimiento" }
 *               descripcion: { type: string, description: "Descripción del requerimiento" }
 *               fecha: { type: string, format: date, description: "Fecha del requerimiento" }
 *     responses:
 *       201:
 *         description: Requerimiento creado exitosamente
 */
router.get('/requerimientos-aula', ctrl.listarTodos);
router.post('/requerimientos-aula', ctrl.crear);

/**
 * @swagger
 * /requerimientos-aula/aula/{id_aula}:
 *   get:
 *     summary: Listar requerimientos por aula
 *     tags: [RequerimientosAula]
 *     parameters:
 *       - in: path
 *         name: id_aula
 *         required: true
 *         schema: { type: string }
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Lista de requerimientos obtenida exitosamente
 */
router.get('/requerimientos-aula/aula/:id_aula', ctrl.listarPorAula);

/**
 * @swagger
 * /requerimientos-aula/revisar/{id}:
 *   put:
 *     summary: Marcar requerimiento como revisado
 *     tags: [RequerimientosAula]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del requerimiento
 *     responses:
 *       200:
 *         description: Requerimiento marcado como revisado
 */
router.put('/requerimientos-aula/revisar/:id', ctrl.marcarRevisado);

/**
 * @swagger
 * /requerimientos-aula/atender/{id}:
 *   put:
 *     summary: Atender requerimiento
 *     tags: [RequerimientosAula]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: ID del requerimiento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - atendido_por
 *             properties:
 *               atendido_por: { type: string, description: "ID de la persona que atiende" }
 *               evidencia: 
 *                 type: object
 *                 properties:
 *                   data: { type: string, description: "Base64 de la evidencia" }
 *                   filename: { type: string, description: "Nombre del archivo" }
 *                   mimetype: { type: string, description: "Tipo MIME" }
 *                   size: { type: number, description: "Tamaño en bytes" }
 *     responses:
 *       200:
 *         description: Requerimiento atendido exitosamente
 */
router.put('/requerimientos-aula/atender/:id', ctrl.atender);

module.exports = router;