const notifService = require('../services/notificacionesService');
const firebaseService = require('../services/firebaseService');
const { sendResponse } = require('../utils/helpers');

exports.registrarToken = async (req, res, next) => {
  try {
    const { persona_id, token, platform } = req.body;
    if (!persona_id || !token) {
      return res.status(400).json({ state: false, message: 'persona_id y token son requeridos' });
    }
    console.log('[push] Registrando token para persona:', persona_id, 'platform:', platform);
    await firebaseService.registrarToken(persona_id, token, platform);
    console.log('[push] Token registrado OK');
    sendResponse(res, { data: null, message: 'Token registrado' });
  } catch (err) { next(err); }
};

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
