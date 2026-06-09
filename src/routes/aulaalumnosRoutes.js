const express = require('express');
const router = express.Router();
const aulaalumnosController = require('../controllers/aulaalumnosController');

/**
 * @swagger
 * tags:
 *   name: AulaAlumnos
 *   description: Endpoints para gestión de AulaAlumnos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AulaAlumno:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id_aula:
 *           type: string
 *           description: ID del aula (ObjectId)
 *         id_alumno:
 *           type: string
 *           description: ID del alumno (ObjectId)
 *         estado:
 *           type: string
 *           enum: [aprobado, reprobado, en curso, retirado, inscrito]
 *         carta_pastoral:
 *           type: object
 *           properties:
 *             data:
 *               type: string
 *               description: Imagen en base64 (data URI o base64 plano)
 *             filename:
 *               type: string
 *             mimetype:
 *               type: string
 *             size:
 *               type: number
 *         createdAt:
 *           type: string
 *         updatedAt:
 *           type: string
 */

/**
 * @swagger
 * /aulaalumnos:
 *   get:
 *     summary: Obtiene todos los AulaAlumnos
 *     tags: [AulaAlumnos]
 *     responses:
 *       200:
 *         description: Lista de AulaAlumnos
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
 *                     $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/aulaalumnos', aulaalumnosController.getAllAulaAlumnos);

/**
 * @swagger
 * /aulaalumnos/solicitudes-retiro:
 *   get:
 *     summary: Obtiene todas las solicitudes de retiro con información completa
 *     description: Retorna todos los registros de AulaAlumno con estado 'solicitud de retiro', incluyendo datos del alumno, profesor, curso y ciclo
 *     tags: [AulaAlumnos]
 *     responses:
 *       200:
 *         description: Lista de solicitudes de retiro
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
 *                       id_aulaalumno:
 *                         type: string
 *                         description: ID del registro AulaAlumno
 *                       nombre_alumno:
 *                         type: string
 *                         description: Nombre completo del alumno
 *                       nombre_profesor:
 *                         type: string
 *                         description: Nombre completo del profesor
 *                       nombre_curso:
 *                         type: string
 *                         description: Nombre del curso
 *                       nombre_ciclo:
 *                         type: string
 *                         description: Nombre del ciclo
 *                 message:
 *                   type: string
 *                   example: "Solicitudes de retiro obtenidas exitosamente"
 */
router.get('/aulaalumnos/solicitudes-retiro', aulaalumnosController.getSolicitudesDeRetiro);

/**
 * @swagger
 * /aulaalumnos/{id}:
 *   get:
 *     summary: Obtiene un AulaAlumno por id
 *     tags: [AulaAlumnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de AulaAlumno
 *     responses:
 *       200:
 *         description: AulaAlumno encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: AulaAlumno no encontrado
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
router.get('/aulaalumnos/:id', aulaalumnosController.getAulaAlumnoById);

/**
 * @swagger
 * /aulaalumnos:
 *   post:
 *     summary: Crea un nuevo AulaAlumno
 *     tags: [AulaAlumnos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AulaAlumno'
 *     responses:
 *       201:
 *         description: AulaAlumno creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/aulaalumnos', aulaalumnosController.createAulaAlumno);

/**
 * @swagger
 * /aulaalumnos/{id}:
 *   put:
 *     summary: Actualiza un AulaAlumno
 *     tags: [AulaAlumnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de AulaAlumno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AulaAlumno'
 *     responses:
 *       200:
 *         description: AulaAlumno actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: AulaAlumno no encontrado
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
router.put('/aulaalumnos/:id', aulaalumnosController.updateAulaAlumno);

/**
 * @swagger
 * /aulaalumnos/{id}:
 *   delete:
 *     summary: Elimina un AulaAlumno
 *     tags: [AulaAlumnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de AulaAlumno
 *     responses:
 *       200:
 *         description: AulaAlumno eliminado
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
 *         description: AulaAlumno no encontrado
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
router.delete('/aulaalumnos/:id', aulaalumnosController.deleteAulaAlumno);

/**
 * @swagger
 * /aulaalumnos/persona/{id_persona}:
 *   get:
 *     summary: Obtiene todos los registros de AulaAlumno de una persona con datos poblados
 *     tags: [AulaAlumnos]
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
 *           enum: [ciclo]
 *         required: false
 *         description: Si se envía "ciclo", agrupa los registros por ciclo
 *     responses:
 *       200:
 *         description: Registros encontrados
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
 *                     $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/aulaalumnos/persona/:id_persona', aulaalumnosController.getAulaAlumnosPorPersona);

/**
 * @swagger
 * /aulaalumnos/bulk:
 *   post:
 *     summary: Inserta múltiples registros de AulaAlumno para un alumno con estado 'en curso'
 *     tags: [AulaAlumnos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_alumno:
 *                 type: string
 *                 description: ID de la persona (alumno)
 *               id_aulas:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de IDs de aulas
 *               carta_pastoral:
 *                 description: |
 *                   Carta pastoral - puede ser:
 *                   - Un objeto único: aplicado a todos los registros
 *                   - Un array de objetos: uno por cada aula en id_aulas (mismo orden)
 *                   
 *                   Ejemplos:
 *                   - Única: {"data": "base64...", "filename": "carta.jpg"}
 *                   - Array: [{"data": "base64_1..."}, {"data": "base64_2..."}]
 *                 oneOf:
 *                   - type: object
 *                     title: Carta pastoral única
 *                     description: Carta pastoral única aplicada a todos los registros
 *                     properties:
 *                       data:
 *                         type: string
 *                         description: Imagen en base64
 *                       filename:
 *                         type: string
 *                       mimetype:
 *                         type: string
 *                       size:
 *                         type: number
 *                   - type: array
 *                     title: Array de cartas pastorales
 *                     description: Array de cartas pastorales, una por cada aula en id_aulas
 *                     items:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: string
 *                           description: Imagen en base64
 *                         filename:
 *                           type: string
 *                         mimetype:
 *                           type: string
 *                         size:
 *                           type: number
 *     responses:
 *       200:
 *         description: Resultado de la inserción masiva
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
 *                     insertedCount:
 *                       type: number
 *                     insertedIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                     skippedExisting:
 *                       type: array
 *                       items:
 *                         type: string
 *                     totalRequested:
 *                       type: number
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/aulaalumnos/bulk', aulaalumnosController.bulkCreateAulaAlumnos);

/**
 * @swagger
 * /aulaalumnos/inscribir/{id}:
 *   put:
 *     summary: Inscribe un AulaAlumno cambiando su estado a 'inscrito'
 *     tags: [AulaAlumnos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del AulaAlumno a inscribir
 *     responses:
 *       200:
 *         description: AulaAlumno inscrito exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AulaAlumno'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.put('/aulaalumnos/aprobar/:id', aulaalumnosController.inscribirAulaAlumno);

/**
 * @swagger
 * /aulaalumnos/actualizar-estados-aula/{id_aula}:
 *   post:
 *     summary: Actualiza los estados de alumnos según su nota ponderada y finaliza el aula
 *     description: Cambia el estado a 'aprobado' si nota >= 11, 'reprobado' si < 11, o 'retirado' si no tiene nota. También cambia el estado del aula a 'terminada'.
 *     tags: [AulaAlumnos]
 *     parameters:
 *       - in: path
 *         name: id_aula
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula
 *     responses:
 *       200:
 *         description: Estados actualizados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       description: Total de alumnos en el aula
 *                     aprobados:
 *                       type: number
 *                       description: Alumnos aprobados (nota >= 11)
 *                     reprobados:
 *                       type: number
 *                       description: Alumnos reprobados (nota < 11)
 *                     retirados:
 *                       type: number
 *                       description: Alumnos sin nota (marcados como retirado)
 *                     actualizados:
 *                       type: number
 *                       description: Registros que se actualizaron
 *                     aula_estado:
 *                       type: string
 *                       description: Estado del aula (siempre 'terminada')
 *                       example: "terminada"
 *                 message:
 *                   type: string
 *                   example: "Estados actualizados según nota ponderada"
 *       404:
 *         description: Aula no encontrada
 */
router.post('/aulaalumnos/actualizar-estados-aula/:id_aula', aulaalumnosController.actualizarEstadosPorNotaPonderada);

module.exports = router;
