const express = require('express');
const alumnosController = require('../controllers/alumnosController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Alumnos
 *   description: Endpoints para obtener alumnos y docentes por ciclo
 */

/**
 * @swagger
 * /alumnos:
 *   get:
 *     tags:
 *       - Alumnos
 *     summary: Obtener alumnos por ciclo
 *     description: Obtiene la lista de alumnos del ciclo actual por defecto. Se puede filtrar adicionalmente por nivel y/o curso
 *     parameters:
 *       - in: query
 *         name: id_ciclo
 *         schema:
 *           type: string
 *         description: ID del ciclo (opcional). Si no se proporciona, se usa el ciclo actual
 *       - in: query
 *         name: id_nivel
 *         schema:
 *           type: string
 *         description: ID del nivel (opcional). Si se proporciona, filtra los alumnos de ese nivel
 *       - in: query
 *         name: id_curso
 *         schema:
 *           type: string
 *         description: ID del curso (opcional). Si se proporciona, filtra los alumnos de ese curso específico
 *     responses:
 *       200:
 *         description: Lista de alumnos obtenida correctamente
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
 *                     type: object
 *                     properties:
 *                       id_alumno:
 *                         type: string
 *                       nombres:
 *                         type: string
 *                       apellido_paterno:
 *                         type: string
 *                       apellido_materno:
 *                         type: string
 *                       genero:
 *                         type: string
 *                         example: "M"
 *                       email:
 *                         type: string
 *                       telefono:
 *                         type: string
 *                       numero_documento:
 *                         type: string
 *                       direccion:
 *                         type: string
 *                       fecha_nacimiento:
 *                         type: string
 *                         format: date-time
 *                       aulasCount:
 *                         type: number
 *                       estados:
 *                         type: array
 *                         items:
 *                           type: string
 *                 message:
 *                   type: string
 */
router.get('/', alumnosController.getAlumnosPorCiclo);

/**
 * @swagger
 * /alumnos/docentes:
 *   get:
 *     tags:
 *       - Alumnos
 *     summary: Obtener docentes por ciclo
 *     description: Obtiene la lista de docentes del ciclo actual por defecto. Se puede filtrar adicionalmente por nivel y/o curso
 *     parameters:
 *       - in: query
 *         name: id_ciclo
 *         schema:
 *           type: string
 *         description: ID del ciclo (opcional). Si no se proporciona, se usa el ciclo actual
 *       - in: query
 *         name: id_nivel
 *         schema:
 *           type: string
 *         description: ID del nivel (opcional). Si se proporciona, filtra los docentes de ese nivel
 *       - in: query
 *         name: id_curso
 *         schema:
 *           type: string
 *         description: ID del curso (opcional). Si se proporciona, filtra los docentes de ese curso específico
 *     responses:
 *       200:
 *         description: Lista de docentes obtenida correctamente
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
 *                     type: object
 *                     properties:
 *                       id_docente:
 *                         type: string
 *                       nombres:
 *                         type: string
 *                       apellido_paterno:
 *                         type: string
 *                       apellido_materno:
 *                         type: string
 *                       genero:
 *                         type: string
 *                         example: "F"
 *                       email:
 *                         type: string
 *                       telefono:
 *                         type: string
 *                       numero_documento:
 *                         type: string
 *                       direccion:
 *                         type: string
 *                       fecha_nacimiento:
 *                         type: string
 *                         format: date-time
 *                       aulasCount:
 *                         type: number
 *                 message:
 *                   type: string
 */
router.get('/docentes', alumnosController.getDocentesPorCiclo);

module.exports = router;
