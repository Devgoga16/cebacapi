const reportesService = require('../services/reportesService');
const { generarReporteResumenCiclo } = require('../services/reporteResumenCicloService');
const Aula = require('../models/aula');
const Ciclo = require('../models/ciclo');

/**
 * Genera y descarga un reporte de asistencias por aula en formato Excel
 * GET /api/reportes/asistencias/:idAula
 */
const descargarReporteAsistencias = async (req, res, next) => {
  try {
    const { idAula } = req.params;

    if (!idAula) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro idAula es requerido'
      });
    }

    // Obtener información del aula para el nombre del archivo
    const aula = await Aula.findById(idAula)
      .populate('id_curso', 'nombre_curso')
      .populate('id_ciclo', 'nombre_ciclo')
      .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
      .lean();

    if (!aula) {
      return res.status(404).json({
        success: false,
        message: 'Aula no encontrada'
      });
    }

    // Generar el workbook con el reporte
    const workbook = await reportesService.generarReporteAsistencias(idAula);

    // Construir nombre del archivo con curso, ciclo y profesor
    const nombreCurso = (aula.id_curso?.nombre_curso || 'Curso').replace(/[^a-zA-Z0-9]/g, '_');
    const nombreCiclo = (aula.id_ciclo?.nombre_ciclo || 'Ciclo').replace(/[^a-zA-Z0-9]/g, '_');
    const nombreProfesor = aula.id_profesor 
      ? `${aula.id_profesor.apellido_paterno || ''}_${aula.id_profesor.apellido_materno || ''}`.replace(/[^a-zA-Z0-9]/g, '_')
      : 'Profesor';
    
    const filename = `Reporte_${nombreCurso}_${nombreCiclo}_${nombreProfesor}.xlsx`;
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    // Escribir el workbook en la respuesta
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error en descargarReporteAsistencias:', error);
    
    // Si ya se enviaron headers, no podemos enviar JSON
    if (res.headersSent) {
      return res.end();
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Error al generar el reporte de asistencias',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Genera y descarga un ZIP con todos los reportes de un ciclo organizados por nivel y curso
 * GET /api/reportes/ciclo/:idCiclo
 */
const descargarReporteCicloCompleto = async (req, res, next) => {
  try {
    const { idCiclo } = req.params;

    if (!idCiclo) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro idCiclo es requerido'
      });
    }

    // Obtener información del ciclo para el nombre del archivo
    const ciclo = await Ciclo.findById(idCiclo).lean();

    if (!ciclo) {
      return res.status(404).json({
        success: false,
        message: 'Ciclo no encontrado'
      });
    }

    // Construir nombre del archivo ZIP
    const nombreCiclo = ciclo.nombre_ciclo.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Reportes_${nombreCiclo}.zip`;

    // Generar el archivo ZIP (retorna un buffer)
    const zipBuffer = await reportesService.generarReporteCicloCompleto(idCiclo);

    // Configurar headers para descarga del archivo ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length);

    // Enviar el buffer
    res.send(zipBuffer);
    

  } catch (error) {
    console.error('Error en descargarReporteCicloCompleto:', error);
    
    // Si ya se enviaron headers, no podemos enviar JSON
    if (res.headersSent) {
      return res.end();
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Error al generar el reporte completo del ciclo',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Genera y descarga el reporte resumen de un ciclo en formato Excel (2 hojas)
 * GET /api/reportes/resumen-ciclo/:idCiclo
 */
const descargarReporteResumenCiclo = async (req, res, next) => {
  try {
    const { idCiclo } = req.params;

    if (!idCiclo) {
      return res.status(400).json({ success: false, message: 'El parámetro idCiclo es requerido' });
    }

    const ciclo = await Ciclo.findById(idCiclo).lean();
    if (!ciclo) {
      return res.status(404).json({ success: false, message: 'Ciclo no encontrado' });
    }

    const workbook = await generarReporteResumenCiclo(idCiclo);

    const nombreCiclo = ciclo.nombre_ciclo.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Resumen_${nombreCiclo}_${ciclo.año}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    if (res.headersSent) return res.end();
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al generar el reporte resumen',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

module.exports = {
  descargarReporteAsistencias,
  descargarReporteCicloCompleto,
  descargarReporteResumenCiclo,
};
