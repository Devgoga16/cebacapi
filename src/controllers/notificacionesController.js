const notifService = require('../services/notificacionesService');
const { sendResponse } = require('../utils/helpers');

exports.getNotificaciones = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const { page, limit, soloNoLeidas } = req.query;
    const data = await notifService.getNotificaciones(id_persona, {
      page,
      limit,
      soloNoLeidas: soloNoLeidas === 'true',
    });
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.contarNoLeidas = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const count = await notifService.contarNoLeidas(id_persona);
    sendResponse(res, { data: { count } });
  } catch (err) { next(err); }
};

exports.marcarLeida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id_persona } = req.body;
    await notifService.marcarLeida(id, id_persona);
    sendResponse(res, { data: null, message: 'Notificación marcada como leída' });
  } catch (err) { next(err); }
};

exports.marcarTodasLeidas = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    await notifService.marcarTodasLeidas(id_persona);
    sendResponse(res, { data: null, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (err) { next(err); }
};
