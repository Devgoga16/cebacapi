const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * @swagger
 * components:
 *   schemas:
 *     BookAnalytics:
 *       type: object
 *       properties:
 *         bookId:
 *           type: string
 *           description: ID del libro
 *         title:
 *           type: string
 *           description: Título del libro
 *         author:
 *           type: string
 *           description: Autor del libro
 *         totalSold:
 *           type: number
 *           description: Cantidad total vendida
 *         totalRevenue:
 *           type: number
 *           description: Ingresos totales generados
 *         salesCount:
 *           type: number
 *           description: Número de ventas
 *         avgPrice:
 *           type: number
 *           description: Precio promedio de venta
 *         trendData:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 description: Mes en formato YYYY-MM
 *               quantity:
 *                 type: number
 *                 description: Cantidad vendida en el mes
 *               revenue:
 *                 type: number
 *                 description: Ingresos del mes
 *               sales:
 *                 type: number
 *                 description: Número de ventas del mes
 *     
 *     SalesTrend:
 *       type: object
 *       properties:
 *         period:
 *           type: string
 *           description: Período en formato YYYY-MM
 *         totalSales:
 *           type: number
 *           description: Total de ventas en el período
 *         totalRevenue:
 *           type: number
 *           description: Ingresos totales del período
 *         totalBooks:
 *           type: number
 *           description: Total de libros vendidos
 *     
 *     RevenueSummary:
 *       type: object
 *       properties:
 *         period:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date
 *               description: Fecha de inicio del período
 *             endDate:
 *               type: string
 *               format: date
 *               description: Fecha de fin del período
 *         summary:
 *           type: object
 *           properties:
 *             totalSales:
 *               type: number
 *               description: Total de ventas
 *             totalRevenue:
 *               type: number
 *               description: Ingresos totales
 *             totalBooks:
 *               type: number
 *               description: Total de libros vendidos
 *             avgSaleValue:
 *               type: number
 *               description: Valor promedio por venta
 *         byStatus:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reservado, pagado, entregado]
 *               count:
 *                 type: number
 *               revenue:
 *                 type: number
 *               totalBooks:
 *                 type: number
 *     
 *     BookPerformance:
 *       type: object
 *       properties:
 *         bookId:
 *           type: string
 *           description: ID del libro
 *         title:
 *           type: string
 *           description: Título del libro
 *         author:
 *           type: string
 *           description: Autor del libro
 *         currentStock:
 *           type: number
 *           description: Stock actual
 *         currentPrice:
 *           type: number
 *           description: Precio actual
 *         totalSold:
 *           type: number
 *           description: Cantidad total vendida
 *         totalRevenue:
 *           type: number
 *           description: Ingresos totales
 *         salesCount:
 *           type: number
 *           description: Número de ventas
 *         avgPrice:
 *           type: number
 *           description: Precio promedio de venta
 *         priceRange:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *               description: Precio mínimo de venta
 *             max:
 *               type: number
 *               description: Precio máximo de venta
 *         trendData:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 description: Mes en formato YYYY-MM
 *               quantity:
 *                 type: number
 *                 description: Cantidad vendida
 *               revenue:
 *                 type: number
 *                 description: Ingresos del mes
 *               sales:
 *                 type: number
 *                 description: Número de ventas
 */

/**
 * @swagger
 * /api/analytics/books/top-selling:
 *   get:
 *     summary: Obtener libros más vendidos
 *     description: Retorna los libros más vendidos en un período específico
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Período de tiempo para el análisis
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número máximo de libros a retornar
 *     responses:
 *       200:
 *         description: Lista de libros más vendidos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                       example: month
 *                     limit:
 *                       type: number
 *                       example: 10
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BookAnalytics'
 *                 message:
 *                   type: string
 *                   example: Libros más vendidos obtenidos exitosamente
 *                 action_code:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/books/top-selling', analyticsController.getTopSellingBooks);

/**
 * @swagger
 * /api/analytics/sales/trends:
 *   get:
 *     summary: Obtener tendencias de ventas
 *     description: Retorna las tendencias de ventas por período
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Período de agrupación para las tendencias
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 12
 *         description: Número de períodos hacia atrás a incluir
 *     responses:
 *       200:
 *         description: Tendencias de ventas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: string
 *                       example: month
 *                     months:
 *                       type: number
 *                       example: 12
 *                     trends:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SalesTrend'
 *                 message:
 *                   type: string
 *                   example: Tendencias de ventas obtenidas exitosamente
 *                 action_code:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/sales/trends', analyticsController.getSalesTrends);

/**
 * @swagger
 * /api/analytics/revenue/summary:
 *   get:
 *     summary: Obtener resumen de ingresos
 *     description: Retorna un resumen detallado de ingresos para un período específico
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Fecha de inicio del período (formato YYYY-MM-DD). Si no se especifica, se usa el último mes
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         description: Fecha de fin del período (formato YYYY-MM-DD). Si no se especifica, se usa la fecha actual
 *     responses:
 *       200:
 *         description: Resumen de ingresos obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/RevenueSummary'
 *                 message:
 *                   type: string
 *                   example: Resumen de ingresos obtenido exitosamente
 *                 action_code:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: Parámetros inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/revenue/summary', analyticsController.getRevenueSummary);

/**
 * @swagger
 * /api/analytics/books/performance:
 *   get:
 *     summary: Obtener rendimiento de un libro específico
 *     description: Retorna estadísticas detalladas de rendimiento para un libro específico
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *           example: "507f1f77bcf86cd799439011"
 *         description: ID del libro para analizar
 *     responses:
 *       200:
 *         description: Rendimiento del libro obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 state:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/BookPerformance'
 *                 message:
 *                   type: string
 *                   example: Rendimiento del libro obtenido exitosamente
 *                 action_code:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: Parámetros inválidos
 *       404:
 *         description: Libro no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/books/performance', analyticsController.getBookPerformance);

module.exports = router;