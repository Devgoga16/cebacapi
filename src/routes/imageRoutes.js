const express = require('express');
const multer = require('multer');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Configuración de multer para manejo de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 10 // máximo 10 archivos por request
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP, BMP)'));
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ImageUploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica si la subida fue exitosa
 *         id:
 *           type: string
 *           description: ID único de la imagen en el servicio
 *         name:
 *           type: string
 *           description: Nombre de la imagen
 *         extension:
 *           type: string
 *           description: Extensión del archivo
 *         size:
 *           type: number
 *           description: Tamaño del archivo en bytes
 *         width:
 *           type: number
 *           description: Ancho de la imagen en píxeles
 *         height:
 *           type: number
 *           description: Alto de la imagen en píxeles
 *         url:
 *           type: string
 *           description: URL completa de la imagen
 *         display_url:
 *           type: string
 *           description: URL de visualización de la imagen
 *         thumb:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: URL del thumbnail
 *         medium:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               description: URL de tamaño medio
 *         delete_url:
 *           type: string
 *           description: URL para eliminar la imagen
 *         upload_date:
 *           type: string
 *           format: date-time
 *           description: Fecha de subida
 *         original_filename:
 *           type: string
 *           description: Nombre original del archivo
 */

/**
 * @swagger
 * /api/images/upload/file:
 *   post:
 *     summary: Subir imagen desde archivo
 *     description: Sube una imagen desde un archivo usando multipart/form-data
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen a subir
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ImageUploadResponse'
 *                 message:
 *                   type: string
 *                   example: Imagen subida exitosamente
 *                 action_code:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
router.post('/upload/file', upload.single('image'), imageController.uploadFromFile);

/**
 * @swagger
 * /api/images/upload/base64:
 *   post:
 *     summary: Subir imagen desde Base64
 *     description: Sube una imagen desde un string en Base64
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base64:
 *                 type: string
 *                 description: String Base64 de la imagen (con o sin prefijo data:image)
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
 *               filename:
 *                 type: string
 *                 description: Nombre opcional para el archivo
 *                 example: "mi-imagen.jpg"
 *             required:
 *               - base64
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ImageUploadResponse'
 *                 message:
 *                   type: string
 *                   example: Imagen subida exitosamente desde base64
 *                 action_code:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
router.post('/upload/base64', imageController.uploadFromBase64);

/**
 * @swagger
 * /api/images/upload/url:
 *   post:
 *     summary: Subir imagen desde URL
 *     description: Sube una imagen descargándola desde una URL externa
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL de la imagen a descargar y subir
 *                 example: "https://example.com/imagen.jpg"
 *             required:
 *               - url
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ImageUploadResponse'
 *                 message:
 *                   type: string
 *                   example: Imagen subida exitosamente desde URL
 *                 action_code:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
router.post('/upload/url', imageController.uploadFromUrl);

/**
 * @swagger
 * /api/images/upload/multiple:
 *   post:
 *     summary: Subir múltiples imágenes
 *     description: Sube múltiples imágenes desde archivos (máximo 10)
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Archivos de imagen a subir (máximo 10)
 *             required:
 *               - images
 *     responses:
 *       200:
 *         description: Subida de múltiples imágenes completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   enum: [success, partial]
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     successful:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                           data:
 *                             $ref: '#/components/schemas/ImageUploadResponse'
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         successful:
 *                           type: number
 *                         failed:
 *                           type: number
 *                 message:
 *                   type: string
 *                   example: "Subida completada: 3 exitosas, 1 fallidas"
 *                 action_code:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: Error de validación
 *       500:
 *         description: Error interno del servidor
 */
router.post('/upload/multiple', upload.array('images', 10), imageController.uploadMultiple);

module.exports = router;