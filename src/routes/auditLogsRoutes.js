const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditLogsController');

/**
 * @swagger
 * tags:
 *   name: AuditLogs
 *   description: Consulta del registro de auditoría (base de datos separada)
 */

/**
 * @swagger
 * /audit-logs:
 *   get:
 *     summary: Lista los logs de auditoría con filtros y paginación
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: query
 *         name: accion
 *         schema: { type: string }
 *         description: Filtrar por código de acción (ej. AULA_CREADA)
 *       - in: query
 *         name: entidad
 *         schema: { type: string }
 *         description: Filtrar por entidad (ej. Aula, Inscripcion)
 *       - in: query
 *         name: id_usuario
 *         schema: { type: string }
 *         description: Filtrar por ID del usuario que ejecutó la acción
 *       - in: query
 *         name: desde
 *         schema: { type: string, format: date }
 *         description: Fecha inicio (ISO 8601)
 *       - in: query
 *         name: hasta
 *         schema: { type: string, format: date }
 *         description: Fecha fin (ISO 8601)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Lista de logs con metadatos de paginación
 */
router.get('/', ctrl.getLogs);

/**
 * @swagger
 * /audit-logs/{id}:
 *   get:
 *     summary: Obtiene un log específico por ID
 *     tags: [AuditLogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Log encontrado
 *       404:
 *         description: Log no encontrado
 */
router.get('/:id', ctrl.getLogById);

module.exports = router;
