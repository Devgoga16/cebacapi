const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');

/**
 * @swagger
 * tags:
 *   name: Reportes
 *   description: Endpoints para generar reportes en Excel
 */

/**
 * @swagger
 * /reportes/asistencias/{idAula}:
 *   get:
 *     summary: Genera y descarga un reporte completo en formato Excel
 *     description: |
 *       Genera un archivo Excel con dos pestañas:
 *       
 *       **Pestaña 1: Reporte de Asistencias**
 *       - Información del curso, ciclo y docente
 *       - Lista de alumnos con sus asistencias por fecha
 *       - Marcadores de estado: P=Presente (verde), A=Ausente (rojo), J=Justificado (amarillo), T=Tarde (naranja)
 *       
 *       **Pestaña 2: Calificaciones**
 *       - Lista de alumnos con sus calificaciones por tipo
 *       - Cada tipo de calificación muestra su porcentaje de ponderación
 *       - Promedio ponderado final en escala vigesimal (0-20)
 *       - Color verde para aprobados (≥11) y rojo para desaprobados (<11)
 *     tags: [Reportes]
 *     parameters:
 *       - in: path
 *         name: idAula
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del aula para generar el reporte
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Archivo Excel generado exitosamente con dos pestañas (Asistencias y Calificaciones)
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetro idAula no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "El parámetro idAula es requerido"
 *       404:
 *         description: Aula no encontrada o sin asistencias registradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Aula no encontrada"
 *       500:
 *         description: Error al generar el reporte
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error al generar el reporte de asistencias"
 *                 error:
 *                   type: string
 *                   description: Stack trace (solo en desarrollo)
 */
router.get('/asistencias/:idAula', reportesController.descargarReporteAsistencias);

/**
 * @swagger
 * /reportes/ciclo/{idCiclo}:
 *   get:
 *     summary: Genera y descarga un ZIP con todos los reportes de un ciclo
 *     description: |
 *       Genera un archivo ZIP que contiene todos los reportes Excel organizados por:
 *       
 *       **Estructura del ZIP:**
 *       ```
 *       Reportes_Ciclo_2026-I.zip
 *       ├── Nivel_I/
 *       │   ├── Teologia_Sistematica/
 *       │   │   ├── Reporte_Lunes_Prof_Perez.xlsx
 *       │   │   └── Reporte_Miercoles_Prof_Garcia.xlsx
 *       │   └── Homiletica/
 *       │       └── Reporte_Viernes_Prof_Lopez.xlsx
 *       └── Nivel_II/
 *           └── Hermeneutica/
 *               └── Reporte_Martes_Prof_Martinez.xlsx
 *       ```
 *       
 *       Cada archivo Excel contiene dos pestañas:
 *       - **Asistencias**: con marcadores P/A/J/T por fecha
 *       - **Calificaciones**: con notas y promedio ponderado
 *     tags: [Reportes]
 *     parameters:
 *       - in: path
 *         name: idCiclo
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ciclo para generar todos los reportes
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Archivo ZIP generado exitosamente con todos los reportes organizados
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Parámetro idCiclo no proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "El parámetro idCiclo es requerido"
 *       404:
 *         description: Ciclo no encontrado o sin aulas registradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Ciclo no encontrado"
 *       500:
 *         description: Error al generar el reporte completo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error al generar el reporte completo del ciclo"
 *                 error:
 *                   type: string
 *                   description: Stack trace (solo en desarrollo)
 */
router.get('/ciclo/:idCiclo', reportesController.descargarReporteCicloCompleto);

/**
 * @swagger
 * /reportes/resumen-ciclo/{idCiclo}:
 *   get:
 *     summary: Genera el reporte resumen general de un ciclo en Excel
 *     description: |
 *       Genera un archivo Excel con dos hojas:
 *
 *       **Hoja 1 – Resumen General**
 *       - KPIs: total alumnos matriculados, profesores asignados, aulas creadas, nivel de asistencia
 *       - Tabla de estados: aprobados, reprobados, en curso, retirados (con porcentajes)
 *       - Gráfico de barras embebido con la distribución de estados
 *
 *       **Hoja 2 – Reporte de Alumnos**
 *       - Listado de alumnos únicos del ciclo con nombre, género, iglesia, ministerio, estado y nota
 *       - Filtros nativos de Excel en todas las columnas (iglesia, ministerio, género, estado)
 *       - Fila de encabezado congelada para navegación cómoda
 *     tags: [Reportes]
 *     parameters:
 *       - in: path
 *         name: idCiclo
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del ciclo
 *     responses:
 *       200:
 *         description: Archivo Excel generado exitosamente
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Ciclo no encontrado
 *       500:
 *         description: Error al generar el reporte
 */
router.get('/resumen-ciclo/:idCiclo', reportesController.descargarReporteResumenCiclo);

module.exports = router;
