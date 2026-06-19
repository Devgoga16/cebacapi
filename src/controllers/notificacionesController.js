const notificacionesService = require('../services/notificacionesService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

/**
 * GET /notificaciones/:id_usuario?leido=true|false&page=1&limit=20
 */
exports.getNotificacionesPorUsuario = async (req, res, next) => {
  try {
    const { id_usuario } = req.params;
    const { leido, page, limit } = req.query || {};
    const data = await notificacionesService.getNotificacionesPorUsuario(id_usuario, { leido, page, limit });
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /notificaciones/:id_usuario/no-leidas/count
 */
exports.contarNoLeidas = async (req, res, next) => {
  try {
    const { id_usuario } = req.params;
    const data = await notificacionesService.contarNoLeidas(id_usuario);
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /notificaciones/:id/leer
 */
exports.marcarLeida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notificacion = await notificacionesService.marcarLeida(id);
    if (!notificacion) return sendResponse(res, { state: 'failed', data: null, message: 'Notificación no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'NOTIFICACION_LEIDA',
      entidad: 'Notificacion',
      id_entidad: id,
      actor: req.actor,
      descripcion: `Notificación ${id} marcada como leída`,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: notificacion, message: 'Notificación marcada como leída' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /notificaciones/:id_usuario/leer-todas
 */
exports.marcarTodasLeidas = async (req, res, next) => {
  try {
    const { id_usuario } = req.params;
    const resultado = await notificacionesService.marcarTodasLeidas(id_usuario);
    audit.registrar({
      accion: 'NOTIFICACIONES_TODAS_LEIDAS',
      entidad: 'Notificacion',
      id_entidad: id_usuario,
      actor: req.actor,
      descripcion: `Usuario ${id_usuario} marcó ${resultado.modificadas} notificaciones como leídas`,
      payload: resultado,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: resultado, message: 'Notificaciones marcadas como leídas' });
  } catch (err) {
    next(err);
  }
};
