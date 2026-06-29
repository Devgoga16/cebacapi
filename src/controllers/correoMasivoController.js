const correoMasivoService = require('../services/correoMasivoService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

/**
 * POST /correos/masivo/todos
 * body: { titulo, texto }
 */
exports.enviarATodos = async (req, res, next) => {
  try {
    const { titulo, texto } = req.body || {};
    const result = await correoMasivoService.enviarATodos({ titulo, texto });

    audit.registrar({
      accion: 'CORREO_MASIVO_ENVIADO',
      entidad: 'Persona',
      actor: req.actor,
      descripcion: `Correo masivo "${titulo}" enviado a ${result.totalDestinatarios} destinatario(s)`,
      payload: { titulo, totalDestinatarios: result.totalDestinatarios },
      request_body: { titulo, texto },
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: result,
      message: `Correo enviado a ${result.totalDestinatarios} destinatario(s)`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /correos/masivo/individual
 * body: { titulo, texto, email }
 */
exports.enviarAUno = async (req, res, next) => {
  try {
    const { titulo, texto, email } = req.body || {};
    const result = await correoMasivoService.enviarAUno({ titulo, texto, email });

    audit.registrar({
      accion: 'CORREO_INDIVIDUAL_ENVIADO',
      entidad: 'Persona',
      actor: req.actor,
      descripcion: `Correo "${titulo}" enviado a ${email}`,
      payload: { titulo, email },
      request_body: { titulo, texto, email },
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: result,
      message: `Correo enviado a ${email}`,
    });
  } catch (err) {
    next(err);
  }
};
