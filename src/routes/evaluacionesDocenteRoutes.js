const express = require('express');
const router = express.Router();
const controller = require('../controllers/evaluacionesDocenteController');

/**
 * @swagger
 * tags:
 *   name: EvaluacionesDocente
 *   description: Evaluaciones anónimas de docentes por alumnos
 */

router.post('/evaluaciones-docente', controller.crear);
router.get('/evaluaciones-docente/pendientes', controller.pendientes);
router.get('/evaluaciones-docente/ya-evaluo/:idAula', controller.yaEvaluo);
router.get('/evaluaciones-docente/aula/:idAula', controller.getByAula);
router.get('/evaluaciones-docente/docente/:idProfesor', controller.resumenDocente);
router.get('/evaluaciones-docente/docente/:idProfesor/aula/:idAula', controller.resumenDocentePorAula);

module.exports = router;
