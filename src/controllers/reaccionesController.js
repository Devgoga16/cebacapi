const reaccionesService = require('../services/reaccionesService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

/**
 * POST /reacciones
 * body: { tipo_entidad, id_anuncio, id_usuario, reaccion }
 * Toggle: crea, actualiza o quita la reacción del usuario sobre el anuncio.
 */
exports.reaccionar = async (req, res, next) => {
  try {
    const { tipo_entidad, id_anuncio, id_usuario, reaccion } = req.body || {};

    if (!tipo_entidad || !id_anuncio || !id_usuario || !reaccion) {
      return sendResponse(res, {
        state: 'failed',
        data: null,
        message: 'tipo_entidad, id_anuncio, id_usuario y reaccion son requeridos',
        action_code: 400,
      });
    }

    const resultado = await reaccionesService.reaccionar({ tipo_entidad, id_anuncio, id_usuario, reaccion });

    audit.registrar({
      accion: `REACCION_${resultado.accion.toUpperCase()}`,
      entidad: 'Reaccion',
      id_entidad: resultado.reaccion?._id?.toString() || id_anuncio,
      actor: req.actor,
      descripcion: `Usuario ${id_usuario} ${resultado.accion} su reacción "${reaccion}" en ${tipo_entidad} ${id_anuncio}`,
      payload: { tipo_entidad, id_anuncio, id_usuario, reaccion, accion: resultado.accion },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, { data: resultado, message: `Reacción ${resultado.accion}` });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /reacciones/:tipo_entidad/:id_anuncio/:id_usuario
 */
exports.quitarReaccion = async (req, res, next) => {
  try {
    const { tipo_entidad, id_anuncio, id_usuario } = req.params;
    const resultado = await reaccionesService.quitarReaccion({ tipo_entidad, id_anuncio, id_usuario });

    audit.registrar({
      accion: 'REACCION_ELIMINADA',
      entidad: 'Reaccion',
      id_entidad: id_anuncio,
      actor: req.actor,
      descripcion: `Usuario ${id_usuario} quitó su reacción en ${tipo_entidad} ${id_anuncio}`,
      payload: { tipo_entidad, id_anuncio, id_usuario },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, { data: resultado, message: 'Reacción eliminada' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /reacciones/:tipo_entidad/:id_anuncio/resumen?id_usuario=X
 */
exports.getResumen = async (req, res, next) => {
  try {
    const { tipo_entidad, id_anuncio } = req.params;
    const { id_usuario } = req.query || {};
    const data = await reaccionesService.getResumen(tipo_entidad, id_anuncio, id_usuario);
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /reacciones/:tipo_entidad/:id_anuncio/detalle
 */
exports.getDetalle = async (req, res, next) => {
  try {
    const { tipo_entidad, id_anuncio } = req.params;
    const data = await reaccionesService.getDetalle(tipo_entidad, id_anuncio);
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};
