const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Verifica el estado de la API
 *     responses:
 *       200:
 *         description: API funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/status', statusController.getStatus);

module.exports = router;
