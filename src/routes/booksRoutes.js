const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');

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
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
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
 *               author:
 *                 type: string
 *                 description: Autor del libro
 *               description:
 *                 type: string
 *                 description: Descripción del libro
 *               price:
 *                 type: number
 *                 description: Precio del libro
 *               stock:
 *                 type: number
 *                 description: Stock inicial (opcional)
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
router.post('/books', booksController.crearLibro);
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
 *             properties:
 *               buyer:
 *                 type: string
 *                 description: ID de la persona que compra
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
 *     responses:
 *       201:
 *         description: Compra realizada exitosamente
 */
router.post('/books/buy', booksController.comprarLibros);

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

module.exports = router;