const express = require('express');
const router = express.Router();
const personasController = require('../controllers/personasController');

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

module.exports = router;
