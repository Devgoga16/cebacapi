const express = require('express');
const multer = require('multer');
const router = express.Router();
const personasController = require('../controllers/personasController');

const storage = multer.memoryStorage();
const uploadExcel = multer({
	storage,
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
	fileFilter: (req, file, cb) => {
		const allowedMimes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-excel',
			'application/octet-stream',
		];

		const isExcelByMime = allowedMimes.includes(file.mimetype);
		const isExcelByExt = /\.(xlsx|xls)$/i.test(file.originalname || '');

		if (isExcelByMime || isExcelByExt) {
			cb(null, true);
			return;
		}
		cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
	},
});

/**
 * @swagger
 * tags:
 *   name: Personas
 *   description: Endpoints para gestión de personas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Persona:
 *       type: object
 *       required:
 *         - nombres
 *         - email
 *         - apellido_paterno
 *         - apellido_materno
 *         - telefono
 *         - direccion
 *         - fecha_nacimiento
 *         - numero_documento
 *         - estado_civil
 *         - fecha_bautismo
 *         - fecha_conversion
 *       properties:
 *         _id:
 *           type: string
 *         id_user:
 *           type: string
 *           description: ID del usuario (ObjectId)
 *         nombres:
 *           type: string
 *         email:
 *           type: string
 *         apellido_paterno:
 *           type: string
 *         apellido_materno:
 *           type: string
 *         telefono:
 *           type: string
 *         direccion:
 *           type: string
 *         fecha_nacimiento:
 *           type: string
 *           format: date
 *         numero_documento:
 *           type: string
 *         estado_civil:
 *           type: string
 *           enum: [Soltero, Casado, Divorciado, Viudo, Otro]
 *         fecha_bautismo:
 *           type: string
 *           format: date
 *         fecha_conversion:
 *           type: string
 *           format: date
 *         id_ministerio:
 *           type: string
 *           description: ID del ministerio (ObjectId)
 *         otra_denominacion:
 *           type: string
 *         imagen:
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
 * /personas:
 *   get:
 *     summary: Obtiene todas las personas
 *     tags: [Personas]
 *     responses:
 *       200:
 *         description: Lista de personas
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
 *                     $ref: '#/components/schemas/Persona'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/personas', personasController.getAllPersonas);

/**
 * @swagger
 * /personas/{id}:
 *   get:
 *     summary: Obtiene una persona por id
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la persona
 *     responses:
 *       200:
 *         description: Persona encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Persona'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Persona no encontrada
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
router.get('/personas/:id', personasController.getPersonaById);

/**
 * @swagger
 * /personas/rol/{nombre_rol}:
 *   get:
 *     summary: Obtiene todas las personas por nombre de rol
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: nombre_rol
 *         schema:
 *           type: string
 *         required: true
 *         description: Nombre del rol (ej. "Administrador", "Líder", etc.)
 *     responses:
 *       200:
 *         description: Lista de personas encontradas con el rol indicado
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
 *                     $ref: '#/components/schemas/Persona'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: No se encontraron personas con ese rol
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
router.get('/personas/rol/:nombre_rol', personasController.getAllPersonasByRol);

/**
 * @swagger
 * /personas:
 *   post:
 *     summary: Crea una nueva persona
 *     tags: [Personas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Persona'
 *     responses:
 *       201:
 *         description: Persona creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Persona'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/personas', personasController.createPersona);

/**
 * @swagger
 * /personas/import-excel:
 *   post:
 *     summary: Importa personas (y opcionalmente usuarios) desde un archivo Excel
 *     tags: [Personas]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Archivo Excel .xlsx o .xls
 *               create_users:
 *                 type: string
 *                 enum: ["true", "false"]
 *                 description: Si es "true", crea usuarios usando DNI como username y password; si falta DNI en una fila, no crea usuario ni persona en esa fila
 *               default_genero:
 *                 type: string
 *                 enum: [M, F]
 *                 description: Género por defecto para filas sin este campo en Excel
 *               default_direccion:
 *                 type: string
 *                 description: Dirección por defecto
 *               default_estado_civil:
 *                 type: string
 *                 enum: [Soltero, Casado, Divorciado, Viudo, Otro]
 *                 description: Estado civil por defecto
 *               default_fecha_conversion:
 *                 type: string
 *                 format: date
 *                 description: Fecha de conversión por defecto
 *               default_fecha_bautismo:
 *                 type: string
 *                 format: date
 *                 description: Fecha de bautismo por defecto cuando Bautizado=true
 *     responses:
 *       201:
 *         description: Importación procesada
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
 *                     total_filas:
 *                       type: integer
 *                     personas_insertadas:
 *                       type: integer
 *                     usuarios_insertados:
 *                       type: integer
 *                     filas_omitidas:
 *                       type: integer
 *                     errores:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fila:
 *                             type: integer
 *                           motivo:
 *                             type: string
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.post('/personas/import-excel', uploadExcel.single('file'), personasController.importarPersonasExcel);

/**
 * @swagger
 * /personas/{id}:
 *   put:
 *     summary: Actualiza una persona
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la persona
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Persona'
 *     responses:
 *       200:
 *         description: Persona actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Persona'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 *       404:
 *         description: Persona no encontrada
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
router.put('/personas/:id', personasController.updatePersona);

/**
 * @swagger
 * /personas/{id}:
 *   delete:
 *     summary: Elimina una persona
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la persona
 *     responses:
 *       200:
 *         description: Persona eliminada
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
 *         description: Persona no encontrada
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
router.delete('/personas/:id', personasController.deletePersona);

/**
 * @swagger
 * /personas/buscar:
 *   get:
 *     summary: Busca personas por número de documento y/o nombres/apellidos
 *     tags: [Personas]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: false
 *         description: Búsqueda global. Tokens numéricos matchean documento por prefijo; tokens texto matchean nombres/apellidos por prefijo.
 *       - in: query
 *         name: numero_documento
 *         schema:
 *           type: string
 *         required: false
 *         description: Prefijo del número de documento (use exact=true para match exacto)
 *       - in: query
 *         name: exact
 *         schema:
 *           type: string
 *           enum: ["true","false"]
 *         required: false
 *         description: Si se envía "true" y numero_documento, busca match exacto para documento
 *       - in: query
 *         name: nombres
 *         schema:
 *           type: string
 *         required: false
 *         description: Prefijo de nombres
 *       - in: query
 *         name: apellido_paterno
 *         schema:
 *           type: string
 *         required: false
 *         description: Prefijo de apellido paterno
 *       - in: query
 *         name: apellido_materno
 *         schema:
 *           type: string
 *         required: false
 *         description: Prefijo de apellido materno
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Página (por defecto 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Límite por página (por defecto 20, máx 100)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [apellidos, nombres, documento, recientes]
 *         required: false
 *         description: Ordenamiento
 *     responses:
 *       200:
 *         description: Resultado de búsqueda
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Persona'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                         limit:
 *                           type: integer
 */
router.get('/personas/buscar', personasController.buscarPersonas);

/**
 * @swagger
 * /personas/{id}/inscripciones:
 *   get:
 *     summary: Obtiene las inscripciones de una persona con información detallada
 *     description: Retorna todas las inscripciones (aulaalumno) de una persona, incluyendo información del aula, curso, nivel del curso y profesor. Los datos se presentan con todas las relaciones resueltas para facilitar su uso.
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la persona (ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Inscripciones encontradas exitosamente
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
 *                       _id:
 *                         type: string
 *                         description: ID de la inscripción (aulaalumno)
 *                         example: "507f1f77bcf86cd799439011"
 *                       id_aula:
 *                         type: string
 *                         description: ID del aula
 *                         example: "507f1f77bcf86cd799439012"
 *                       id_alumno:
 *                         type: string
 *                         description: ID del alumno (persona)
 *                         example: "507f1f77bcf86cd799439013"
 *                       estado:
 *                         type: string
 *                         enum: [aprobado, reprobado, en curso, retirado, inscrito, pendiente]
 *                         description: Estado de la inscripción del alumno
 *                         example: "en curso"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha de creación del registro
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha de última actualización
 *                       aula:
 *                         type: object
 *                         description: Información del aula
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: ID del aula
 *                           es_presencial:
 *                             type: boolean
 *                             description: Indica si el aula es presencial
 *                             example: true
 *                           dia:
 *                             type: string
 *                             description: Día de la semana
 *                             example: "Lunes"
 *                           hora_inicio:
 *                             type: string
 *                             description: Hora de inicio de la clase
 *                             example: "18:00"
 *                           hora_fin:
 *                             type: string
 *                             description: Hora de finalización de la clase
 *                             example: "20:00"
 *                           aforo:
 *                             type: number
 *                             description: Capacidad máxima del aula
 *                             example: 30
 *                           estado:
 *                             type: string
 *                             enum: [creada, iniciada, terminada]
 *                             description: Estado actual del aula
 *                             example: "iniciada"
 *                           fecha_inicio:
 *                             type: string
 *                             format: date-time
 *                             description: Fecha de inicio del aula
 *                           fecha_fin:
 *                             type: string
 *                             format: date-time
 *                             description: Fecha de finalización del aula
 *                           linkWhatsApp:
 *                             type: string
 *                             description: Link del grupo de WhatsApp (opcional)
 *                             example: "https://chat.whatsapp.com/..."
 *                           numeroAula:
 *                             type: string
 *                             description: Número identificador del aula (opcional)
 *                             example: "A101"
 *                       curso:
 *                         type: object
 *                         description: Información del curso
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: ID del curso
 *                           nombre_curso:
 *                             type: string
 *                             description: Nombre del curso
 *                             example: "Introducción a la Teología"
 *                           descripcion_curso:
 *                             type: string
 *                             description: Descripción del curso (opcional)
 *                           electivo:
 *                             type: boolean
 *                             description: Indica si el curso es electivo
 *                             example: false
 *                           sesiones:
 *                             type: number
 *                             description: Número de sesiones del curso
 *                             example: 12
 *                       nivel:
 *                         type: object
 *                         description: Información del nivel académico del curso
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: ID del nivel
 *                           nombre_nivel:
 *                             type: string
 *                             description: Nombre del nivel académico
 *                             example: "Nivel 1"
 *                       profesor:
 *                         type: object
 *                         description: Información del profesor del aula
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: ID del profesor (persona)
 *                           nombres:
 *                             type: string
 *                             description: Nombres del profesor
 *                             example: "JUAN CARLOS"
 *                           apellido_paterno:
 *                             type: string
 *                             description: Apellido paterno del profesor
 *                             example: "PÉREZ"
 *                           apellido_materno:
 *                             type: string
 *                             description: Apellido materno del profesor
 *                             example: "GARCÍA"
 *                           email:
 *                             type: string
 *                             description: Email del profesor (opcional)
 *                             example: "juan.perez@example.com"
 *                           telefono:
 *                             type: string
 *                             description: Teléfono del profesor
 *                             example: "987654321"
 *                       ciclo:
 *                         type: object
 *                         description: Información del ciclo académico
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: ID del ciclo
 *                           nombre_ciclo:
 *                             type: string
 *                             description: Nombre del ciclo
 *                             example: "2024-I"
 *                           fecha_inicio:
 *                             type: string
 *                             format: date-time
 *                             description: Fecha de inicio del ciclo
 *                           fecha_fin:
 *                             type: string
 *                             format: date-time
 *                             description: Fecha de fin del ciclo
 *                           actual:
 *                             type: boolean
 *                             description: Indica si es el ciclo actual
 *                             example: true
 *                 message:
 *                   type: string
 *                   example: "Inscripciones encontradas"
 *                 action_code:
 *                   type: integer
 *                   example: 200
 *       400:
 *         description: ID de persona inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "failed"
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                   example: "ID de persona inválido"
 *                 action_code:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: "failed"
 *                 data:
 *                   type: 'null'
 *                 message:
 *                   type: string
 *                   example: "Error al obtener inscripciones"
 *                 action_code:
 *                   type: integer
 *                   example: 500
 */
router.get('/personas/:id/inscripciones', personasController.getInscripcionesByPersona);
router.patch('/personas/:id/tutorial', personasController.marcarTutorialVisto);

module.exports = router;
