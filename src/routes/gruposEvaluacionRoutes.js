const express = require('express');
const router = express.Router();
const controller = require('../controllers/gruposEvaluacionController');

/**
 * @swagger
 * tags:
 *   name: GruposEvaluacion
 *   description: Gestión de grupos y criterios de evaluación docente
 */

router.get('/grupos-evaluacion', controller.getAll);
router.get('/grupos-evaluacion/activos', controller.getActivos);
router.get('/grupos-evaluacion/:id', controller.getById);
router.post('/grupos-evaluacion', controller.create);
router.put('/grupos-evaluacion/:id', controller.update);
router.delete('/grupos-evaluacion/:id', controller.delete);

module.exports = router;
