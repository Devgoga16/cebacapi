const tiposCalificacionService = require('../services/tiposCalificacionService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

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

    const { tipos: tiposCreados, calificacionesEliminadas } = await tiposCalificacionService.setTiposCalificacion(idAula, tipos);
    audit.registrar({
      accion: 'TIPOS_CALIFICACION_CONFIGURADOS',
      entidad: 'TipoCalificacion',
      id_entidad: idAula,
      actor: req.actor,
      descripcion: `Tipos de calificación configurados para el aula ${idAula} — ${tipos.length} tipos`
        + (calificacionesEliminadas > 0 ? ` (se eliminaron ${calificacionesEliminadas} calificaciones de los tipos anteriores)` : ''),
      payload: { idAula, tipos, calificacionesEliminadas },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: { tipos: tiposCreados, calificacionesEliminadas },
      message: calificacionesEliminadas > 0
        ? `Tipos de calificación actualizados. Se eliminaron ${calificacionesEliminadas} calificación(es) que estaban asociadas a los tipos anteriores.`
        : 'Tipos de calificación configurados exitosamente',
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
    audit.registrar({
      accion: 'TIPOS_CALIFICACION_ELIMINADOS',
      entidad: 'TipoCalificacion',
      id_entidad: idAula,
      actor: req.actor,
      descripcion: `Tipos de calificación del aula ${idAula} eliminados`
        + (result.calificacionesEliminadas > 0 ? ` (se eliminaron ${result.calificacionesEliminadas} calificaciones asociadas)` : ''),
      payload: { deletedCount: result.deletedCount, calificacionesEliminadas: result.calificacionesEliminadas },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: { deletedCount: result.deletedCount, calificacionesEliminadas: result.calificacionesEliminadas },
      message: result.calificacionesEliminadas > 0
        ? `Tipos de calificación eliminados. Se eliminaron ${result.calificacionesEliminadas} calificación(es) asociadas.`
        : 'Tipos de calificación eliminados'
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
    audit.registrar({
      accion: 'TIPO_CALIFICACION_ACTUALIZADO',
      entidad: 'TipoCalificacion',
      id_entidad: idTipo,
      actor: req.actor,
      descripcion: `Tipo de calificación ${idTipo} actualizado`,
      payload: updateData,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: tipoActualizado,
      message: 'Tipo de calificación actualizado'
    });
  } catch (err) {
    next(err);
  }
};
