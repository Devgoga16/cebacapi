const calificacionesService = require('../services/calificacionesService');
const { sendResponse } = require('../utils/helpers');

/**
 * Obtiene el roster de un aula con sus tipos de calificación y notas
 * GET /api/calificaciones/roster/:id_aula
 */
exports.getRosterDeAulaParaCalificaciones = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const data = await calificacionesService.getRosterDeAulaParaCalificaciones(id_aula);
    sendResponse(res, { data });
  } catch (err) { 
    next(err); 
  }
};

/**
 * Registra calificaciones en lote
 * POST /api/calificaciones
 */
exports.registrarCalificaciones = async (req, res, next) => {
  try {
    const { items, registrado_por } = req.body || {};
    const result = await calificacionesService.registrarCalificaciones({ items, registrado_por });
    sendResponse(res, { 
      data: result, 
      message: 'Calificaciones registradas exitosamente' 
    });
  } catch (err) { 
    next(err); 
  }
};

/**
 * Obtiene las calificaciones de un alumno en un aula
 * GET /api/calificaciones/:id_aula/alumno/:id_alumno
 */
exports.getCalificacionesDeAlumno = async (req, res, next) => {
  try {
    const { id_aula, id_alumno } = req.params;
    const data = await calificacionesService.getCalificacionesDeAlumno(id_aula, id_alumno);
    sendResponse(res, { data });
  } catch (err) { 
    next(err); 
  }
};

/**
 * Obtiene el resumen completo de calificaciones del aula con estadísticas
 * GET /api/calificaciones/resumen/:id_aula
 */
exports.getResumenCalificacionesAula = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const data = await calificacionesService.getResumenCalificacionesAula(id_aula);
    sendResponse(res, { data });
  } catch (err) { 
    next(err); 
  }
};

/**
 * Elimina una calificación específica
 * DELETE /api/calificaciones/:id_aula/alumno/:id_alumno/tipo/:id_tipo_calificacion
 */
exports.deleteCalificacion = async (req, res, next) => {
  try {
    const { id_aula, id_alumno, id_tipo_calificacion } = req.params;
    const result = await calificacionesService.deleteCalificacion(
      id_aula, 
      id_alumno, 
      id_tipo_calificacion
    );
    sendResponse(res, { 
      data: { deletedCount: result.deletedCount }, 
      message: 'Calificación eliminada' 
    });
  } catch (err) { 
    next(err); 
  }
};
