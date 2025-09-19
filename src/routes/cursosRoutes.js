const express = require('express');
const router = express.Router();
const cursosController = require('../controllers/cursosController');

/**
 * @swagger
 * tags:
 *   name: Cursos
 *   description: Endpoints para gestión de cursos
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     Prerequisito:
 *       type: object
 *       properties:
 *         tipo:
 *           type: string
 *           enum: [Curso, Nivel]
 *           description: Indica si el prerequisito es un curso o un nivel
 *         ref_id:
 *           type: string
 *           description: ObjectId del curso o nivel
 *     Curso:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id_nivel:
 *           type: string
 *           description: ObjectId del nivel
 *         nombre_curso:
 *           type: string
 *         descripcion_curso:
 *           type: string
 *         electivo:
 *           type: boolean
 *         prerequisitos:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Prerequisito'
 *         sesiones:
 *           type: number
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */
/**
 * @swagger
 * /cursos:
 *   get:
 *     summary: Obtiene todos los cursos
 *     tags: [Cursos]
 *     responses:
 *       200:
 *         description: Lista de cursos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Curso'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/cursos', cursosController.getAllCursos);
/**
 * @swagger
 * /cursos/{id}:
 *   get:
 *     summary: Obtiene un curso por id
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Curso encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Curso'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/cursos/:id', cursosController.getCursoById);
/**
 * @swagger
 * /cursos:
 *   post:
 *     summary: Crea un nuevo curso
 *     tags: [Cursos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Curso'
 *     responses:
 *       201:
 *         description: Curso creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Curso'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/cursos', cursosController.createCurso);
/**
 * @swagger
 * /cursos/{id}:
 *   put:
 *     summary: Actualiza un curso
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Curso'
 *     responses:
 *       200:
 *         description: Curso actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Curso'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.put('/cursos/:id', cursosController.updateCurso);
/**
 * @swagger
 * /cursos/{id}:
 *   delete:
 *     summary: Elimina un curso
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Curso eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.delete('/cursos/:id', cursosController.deleteCurso);

/**
 * @swagger
 * /cursos/agrupados/niveles/{id_ciclo}:
 *   get:
 *     summary: Lista cursos agrupados por nivel (niveles ordenados de menor a mayor)
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id_ciclo
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ciclo para el cual listar aulas de cada curso
 *     responses:
 *       200:
 *         description: Cursos agrupados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     niveles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nivel:
 *                             type: object
 *                           cursos:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Curso'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/cursos/agrupados/niveles/:id_ciclo', cursosController.getCursosAgrupadosPorNivel);

/**
 * @swagger
 * /cursos/malla/{id_persona}:
 *   get:
 *     summary: Obtiene la malla curricular de una persona
 *     tags: [Cursos]
 *     parameters:
 *       - in: path
 *         name: id_persona
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la persona (alumno)
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [nivel]
 *         required: false
 *         description: Si se envía "nivel", agrupa los cursos por nivel
 *     responses:
 *       200:
 *         description: Malla curricular con cursos y registros en aulas del alumno
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   oneOf:
 *                     - type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           curso:
 *                             $ref: '#/components/schemas/Curso'
 *                           registros:
 *                             type: array
 *                             items:
 *                               type: object
 *                           total_registros:
 *                             type: number
 *                           tiene_registros:
 *                             type: boolean
 *                     - type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nivel:
 *                             type: object
 *                           cursos:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 curso:
 *                                   $ref: '#/components/schemas/Curso'
 *                                 registros:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                 total_registros:
 *                                   type: number
 *                                 tiene_registros:
 *                                   type: boolean
 *                           total_registros:
 *                             type: number
 *                           cursos_con_registros:
 *                             type: number
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/cursos/malla/:id_persona', cursosController.getMallaCurricularPorPersona);

/**
 * @swagger
 * /cursos/agrupados/niveles-id:
 *   get:
 *     summary: Lista cursos agrupados por id_nivel y ordenados por id_nivel ascendente
 *     tags: [Cursos]
 *     responses:
 *       200:
 *         description: Cursos agrupados por id_nivel (orden asc por ObjectId)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     niveles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nivel:
 *                             type: object
 *                             description: Documento de nivel (si existe)
 *                           cursos:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Curso'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/cursos/agrupados/niveles-id', cursosController.getCursosAgrupadosPorNivelIdAsc);

module.exports = router;
