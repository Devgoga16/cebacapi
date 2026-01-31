const tiposCalificacionService = require('../services/tiposCalificacionService');
const { sendResponse } = require('../utils/helpers');

/**
 * Crea o actualiza los tipos de calificación para un aula
 * POST /api/tipos-calificacion/:idAula
 */
exports.setTiposCalificacion = async (req, res, next) => {
  try {
    const { idAula } = req.params;
    const { tipos } = req.body;

    if (!tipos || !Array.isArray(tipos)) {
      return sendResponse(res, { 
        state: 'failed', 
        data: null, 
        message: 'Se requiere un array de tipos de calificación', 
        action_code: 400 
      });
    }

    const tiposCreados = await tiposCalificacionService.setTiposCalificacion(idAula, tipos);
    
    sendResponse(res, { 
      data: tiposCreados, 
      message: 'Tipos de calificación configurados exitosamente', 
      action_code: 201 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtiene los tipos de calificación de un aula
 * GET /api/tipos-calificacion/:idAula
 */
exports.getTiposCalificacionByAula = async (req, res, next) => {
  try {
    const { idAula } = req.params;
    const tipos = await tiposCalificacionService.getTiposCalificacionByAula(idAula);
    
    sendResponse(res, { 
      data: tipos,
      message: tipos.length > 0 ? 'Tipos de calificación encontrados' : 'No hay tipos de calificación configurados para esta aula'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Elimina los tipos de calificación de un aula
 * DELETE /api/tipos-calificacion/:idAula
 */
exports.deleteTiposCalificacionByAula = async (req, res, next) => {
  try {
    const { idAula } = req.params;
    const result = await tiposCalificacionService.deleteTiposCalificacionByAula(idAula);
    
    sendResponse(res, { 
      data: { deletedCount: result.deletedCount }, 
      message: 'Tipos de calificación eliminados' 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Actualiza un tipo de calificación específico
 * PUT /api/tipos-calificacion/tipo/:idTipo
 */
exports.updateTipoCalificacion = async (req, res, next) => {
  try {
    const { idTipo } = req.params;
    const updateData = req.body;

    const tipoActualizado = await tiposCalificacionService.updateTipoCalificacion(idTipo, updateData);
    
    sendResponse(res, { 
      data: tipoActualizado, 
      message: 'Tipo de calificación actualizado' 
    });
  } catch (err) {
    next(err);
  }
};
