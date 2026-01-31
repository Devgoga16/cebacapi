const express = require('express');
const multer = require('multer');
const router = express.Router();
const booksController = require('../controllers/booksController');

// Configuración de multer para imágenes de libros
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Gestión de libros y ventas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *           description: Título del libro
 *         author:
 *           type: string
 *           description: Autor del libro
 *         description:
 *           type: string
 *           description: Descripción del libro
 *         price:
 *           type: number
 *           description: Precio del libro
 *         stock:
 *           type: number
 *           description: Cantidad disponible
 *         image:
 *           type: object
 *           description: Información de la imagen del libro
 *           properties:
 *             id:
 *               type: string
 *               description: ID de la imagen en el servicio
 *             url:
 *               type: string
 *               description: URL completa de la imagen
 *             display_url:
 *               type: string
 *               description: URL de visualización
 *             thumb_url:
 *               type: string
 *               description: URL del thumbnail
 *             medium_url:
 *               type: string
 *               description: URL tamaño medio
 *             original_filename:
 *               type: string
 *               description: Nombre original del archivo
 *             upload_date:
 *               type: string
 *               format: date-time
 *               description: Fecha de subida
 *     Sale:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         buyer:
 *           type: string
 *           description: ID de la persona que compra
 *         deliveredBy:
 *           type: string
 *           description: ID de la persona que entrega
 *         books:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               book:
 *                 type: string
 *                 description: ID del libro
 *               quantity:
 *                 type: number
 *                 description: Cantidad comprada
 *               unitPrice:
 *                 type: number
 *                 description: Precio unitario
 *         total:
 *           type: number
 *           description: Total de la venta
 *         paymentMethod:
 *           type: string
 *           enum: [efectivo, transferencia, yape]
 *           description: Método de pago
 *         voucher:
 *           type: object
 *           description: Voucher de pago (si aplica)
 *           properties:
 *             id:
 *               type: string
 *             url:
 *               type: string
 *             display_url:
 *               type: string
 *             thumb_url:
 *               type: string
 *             medium_url:
 *               type: string
 *             original_filename:
 *               type: string
 *             upload_date:
 *               type: string
 *               format: date-time
 *         status:
 *           type: string
 *           enum: [reservado, pagado, entregado]
 *         saleDate:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Crear un nuevo libro
 *     description: Crea un nuevo libro con información básica y opcionalmente una imagen de portada
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título del libro
 *                 example: "Cien años de soledad"
 *               author:
 *                 type: string
 *                 description: Autor del libro
 *                 example: "Gabriel García Márquez"
 *               description:
 *                 type: string
 *                 description: Descripción del libro
 *                 example: "Una obra maestra del realismo mágico"
 *               price:
 *                 type: number
 *                 description: Precio del libro
 *                 example: 25.99
 *               stock:
 *                 type: number
 *                 description: Stock inicial (opcional)
 *                 example: 10
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de portada del libro (opcional)
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título del libro
 *                 example: "Cien años de soledad"
 *               author:
 *                 type: string
 *                 description: Autor del libro
 *                 example: "Gabriel García Márquez"
 *               description:
 *                 type: string
 *                 description: Descripción del libro
 *                 example: "Una obra maestra del realismo mágico"
 *               price:
 *                 type: number
 *                 description: Precio del libro
 *                 example: 25.99
 *               stock:
 *                 type: number
 *                 description: Stock inicial (opcional)
 *                 example: 10
 *               imageBase64:
 *                 type: string
 *                 description: Imagen en formato Base64 (opcional)
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
 *               imageUrl:
 *                 type: string
 *                 description: URL de imagen externa (opcional)
 *                 example: "https://example.com/portada.jpg"
 *     responses:
 *       201:
 *         description: Libro creado exitosamente
 *   get:
 *     summary: Listar todos los libros
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: Lista de todos los libros
 */
router.post('/books', upload.single('image'), booksController.crearLibro);
router.get('/books', booksController.listarTodosLibros);

/**
 * @swagger
 * /books/stock:
 *   get:
 *     summary: Listar libros con stock disponible
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: Lista de libros con stock
 */
router.get('/books/stock', booksController.listarLibrosConStock);

/**
 * @swagger
 * /books/{id}/stock:
 *   put:
 *     summary: Agregar stock a un libro
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del libro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *             properties:
 *               cantidad:
 *                 type: number
 *                 minimum: 1
 *                 description: Cantidad a agregar al stock
 *     responses:
 *       200:
 *         description: Stock agregado exitosamente
 */
router.put('/books/:id/stock', booksController.agregarStock);

/**
 * @swagger
 * /books/buy:
 *   post:
 *     summary: Comprar uno o más libros
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyer
 *               - books
 *               - paymentMethod
 *             properties:
 *               buyer:
 *                 type: string
 *                 description: ID de la persona que compra
 *               paymentMethod:
 *                 type: string
 *                 enum: [efectivo, transferencia, yape]
 *                 description: Método de pago
 *               voucherBase64:
 *                 type: string
 *                 description: Voucher en base64 (requerido para transferencia o yape)
 *               voucherUrl:
 *                 type: string
 *                 description: URL del voucher (requerido para transferencia o yape)
 *               books:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - book
 *                     - quantity
 *                   properties:
 *                     book:
 *                       type: string
 *                       description: ID del libro
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                       description: Cantidad a comprar
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - buyer
 *               - books
 *               - paymentMethod
 *             properties:
 *               buyer:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [efectivo, transferencia, yape]
 *               books:
 *                 type: string
 *                 description: JSON string con items (book, quantity)
 *               voucher:
 *                 type: string
 *                 format: binary
 *                 description: Voucher (requerido para transferencia o yape)
 *     responses:
 *       201:
 *         description: Compra realizada exitosamente
 */
router.post('/books/buy', upload.single('voucher'), booksController.comprarLibros);

/**
 * @swagger
 * /books/sales:
 *   get:
 *     summary: Listar ventas
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [reservado, pagado, entregado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: buyer
 *         schema:
 *           type: string
 *         description: Filtrar por comprador (ID)
 *     responses:
 *       200:
 *         description: Lista de ventas
 */
router.get('/books/sales', booksController.listarVentas);

/**
 * @swagger
 * /books/sales/{id}:
 *   get:
 *     summary: Obtener una venta específica
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     responses:
 *       200:
 *         description: Venta obtenida exitosamente
 */
router.get('/books/sales/:id', booksController.obtenerVenta);

/**
 * @swagger
 * /books/sales/{id}/deliver:
 *   put:
 *     summary: Entregar libros comprados
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deliveredBy
 *             properties:
 *               deliveredBy:
 *                 type: string
 *                 description: ID de la persona que entrega
 *     responses:
 *       200:
 *         description: Libros entregados exitosamente
 */
router.put('/books/sales/:id/deliver', booksController.entregarLibros);

/**
 * @swagger
 * /books/sales/{id}/status:
 *   put:
 *     summary: Cambiar estado de una venta
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reservado, pagado, entregado]
 *                 description: Nuevo estado de la venta
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 */
router.put('/books/sales/:id/status', booksController.cambiarEstadoVenta);

/**
 * @swagger
 * /books/my-purchases/{id_persona}:
 *   get:
 *     summary: Ver mis compras por persona
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id_persona
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la persona
 *     responses:
 *       200:
 *         description: Lista de compras de la persona
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
 *                     $ref: '#/components/schemas/Sale'
 *                 message:
 *                   type: string
 *                 action_code:
 *                   type: integer
 */
router.get('/books/my-purchases/:id_persona', booksController.verMisCompras);

/**
 * @swagger
 * /books/sales/{id}/validate-voucher:
 *   put:
 *     summary: Aprobar o rechazar voucher de pago
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - validated_by
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [aprobar, rechazar]
 *                 description: Acción a realizar con el voucher
 *               validated_by:
 *                 type: string
 *                 description: ID de la persona que valida
 *               rejection_reason:
 *                 type: string
 *                 description: Motivo de rechazo (requerido si action es rechazar)
 *     responses:
 *       200:
 *         description: Voucher validado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *                 message:
 *                   type: string
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Venta no encontrada
 */
router.put('/books/sales/:id/validate-voucher', booksController.validarVoucher);

/**
 * @swagger
 * /books/{id}/image:
 *   put:
 *     summary: Actualizar imagen de un libro
 *     description: Actualiza la imagen de portada de un libro específico
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del libro
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageBase64:
 *                 type: string
 *                 description: Imagen en formato Base64
 *               imageUrl:
 *                 type: string
 *                 description: URL de imagen externa
 *     responses:
 *       200:
 *         description: Imagen actualizada exitosamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Libro no encontrado
 */
router.put('/books/:id/image', upload.single('image'), booksController.actualizarImagenLibro);

/**
 * @swagger
 * /books/{id}/image:
 *   delete:
 *     summary: Eliminar imagen de un libro
 *     description: Elimina la imagen de portada de un libro específico
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del libro
 *     responses:
 *       200:
 *         description: Imagen eliminada exitosamente
 *       400:
 *         description: El libro no tiene imagen asignada
 *       404:
 *         description: Libro no encontrado
 */
router.delete('/books/:id/image', booksController.eliminarImagenLibro);

/**
 * @swagger
 * /books/{id}/image:
 *   get:
 *     summary: Obtener información de imagen de un libro
 *     description: Obtiene la información de la imagen de portada de un libro específico
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del libro
 *     responses:
 *       200:
 *         description: Información de imagen obtenida exitosamente
 *       404:
 *         description: Libro no encontrado
 */
router.get('/books/:id/image', booksController.obtenerImagenLibro);

module.exports = router;