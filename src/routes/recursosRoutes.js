const express = require('express');
const multer = require('multer');
const ctrl = require('../controllers/recursosController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB máx
  fileFilter(req, file, cb) {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

/**
 * @swagger
 * tags:
 *   name: Recursos
 *   description: Gestión de recursos y comentarios por aula
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Recurso:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id_aula:
 *           type: string
 *         subido_por:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             nombres:
 *               type: string
 *             apellido_paterno:
 *               type: string
 *         tipo:
 *           type: string
 *           enum: [archivo, link]
 *         titulo:
 *           type: string
 *         descripcion:
 *           type: string
 *         archivo:
 *           type: object
 *           properties:
 *             filename:
 *               type: string
 *             mimetype:
 *               type: string
 *             size:
 *               type: integer
 *         url:
 *           type: string
 *         url_thumbnail:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ComentarioRecurso:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id_recurso:
 *           type: string
 *         autor_id:
 *           type: string
 *         autor_nombre:
 *           type: string
 *         autor_rol:
 *           type: string
 *           enum: [Estudiante, Docente, Coordinador, Admin]
 *         parent_id:
 *           type: string
 *           nullable: true
 *         texto:
 *           type: string
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ComentarioRecurso'
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /aulas/{id}/recursos:
 *   get:
 *     summary: Lista los recursos de un aula
 *     tags: [Recursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del aula
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista paginada de recursos
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
 *                     recursos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Recurso'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get('/aulas/:id/recursos', ctrl.listarRecursos);

/**
 * @swagger
 * /aulas/{id}/recursos:
 *   post:
 *     summary: Sube un recurso al aula (archivo o link)
 *     tags: [Recursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [tipo, titulo, subido_por]
 *             properties:
 *               tipo:
 *                 type: string
 *                 enum: [archivo, link]
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               subido_por:
 *                 type: string
 *                 description: ID del docente
 *               url:
 *                 type: string
 *                 description: Requerido si tipo=link
 *               archivo:
 *                 type: string
 *                 format: binary
 *                 description: Requerido si tipo=archivo (max 15 MB)
 *     responses:
 *       201:
 *         description: Recurso creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Recurso'
 *                 message:
 *                   type: string
 */
router.post('/aulas/:id/recursos', upload.single('archivo'), ctrl.subirRecurso);

/**
 * @swagger
 * /recursos/{id}/download:
 *   get:
 *     summary: Obtiene una URL firmada de descarga para un recurso de tipo archivo
 *     tags: [Recursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL firmada válida por 1 hora
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
 *                     url:
 *                       type: string
 *                     filename:
 *                       type: string
 */
router.get('/recursos/:id/download', ctrl.obtenerUrlDescarga);

/**
 * @swagger
 * /recursos/{id}:
 *   delete:
 *     summary: Elimina un recurso y sus notificaciones asociadas
 *     tags: [Recursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recurso eliminado
 */
router.delete('/recursos/:id', ctrl.eliminarRecurso);

/**
 * @swagger
 * /recursos/{id}/comentarios:
 *   get:
 *     summary: Lista los comentarios de un recurso en forma de árbol
 *     tags: [Recursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Árbol de comentarios (raíz + replies anidadas)
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
 *                     $ref: '#/components/schemas/ComentarioRecurso'
 */
router.get('/recursos/:id/comentarios', ctrl.listarComentarios);

/**
 * @swagger
 * /recursos/{id}/comentarios:
 *   post:
 *     summary: Crea un comentario (o respuesta) en un recurso
 *     tags: [Recursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [autor_id, autor_nombre, autor_rol, texto]
 *             properties:
 *               autor_id:
 *                 type: string
 *               autor_nombre:
 *                 type: string
 *               autor_rol:
 *                 type: string
 *                 enum: [Estudiante, Docente, Coordinador, Admin]
 *               texto:
 *                 type: string
 *                 maxLength: 1000
 *               parent_id:
 *                 type: string
 *                 nullable: true
 *                 description: ID del comentario padre si es una respuesta
 *     responses:
 *       201:
 *         description: Comentario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ComentarioRecurso'
 */
router.post('/recursos/:id/comentarios', ctrl.crearComentario);

/**
 * @swagger
 * /comentarios-recurso/{id}:
 *   delete:
 *     summary: Elimina (soft delete) un comentario de recurso
 *     tags: [Recursos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comentario eliminado
 */
router.delete('/comentarios-recurso/:id', ctrl.eliminarComentario);

module.exports = router;
