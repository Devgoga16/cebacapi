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
      descripcion: `Correo masivo "${titulo}" enviado a ${result.totalDestinatarios} destinatario(s)`
        + (result.descartados > 0 ? ` (${result.descartados} descartado(s) por email inválido)` : ''),
      payload: { titulo, totalDestinatarios: result.totalDestinatarios, descartados: result.descartados },
      request_body: { titulo, texto },
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: result,
      message: `Correo enviado a ${result.totalDestinatarios} destinatario(s)`
        + (result.descartados > 0 ? `. Se descartaron ${result.descartados} email(s) inválido(s).` : ''),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /correos/masivo/todos/stream
 * body: { titulo, texto }
 * Envía uno por uno y reporta el avance como NDJSON (una línea JSON por evento).
 */
exports.enviarATodosStream = async (req, res) => {
  const { titulo, texto } = req.body || {};

  try {
    if (!titulo || !titulo.trim()) {
      res.status(400).json({ message: 'El título del correo es requerido' });
      return;
    }
    if (!texto || !texto.trim()) {
      res.status(400).json({ message: 'El texto del correo es requerido' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const result = await correoMasivoService.enviarATodosConProgreso({ titulo, texto }, (progreso) => {
      res.write(`${JSON.stringify({ type: 'progress', ...progreso })}\n`);
    });

    res.write(`${JSON.stringify({ type: 'done', ...result })}\n`);
    res.end();

    audit.registrar({
      accion: 'CORREO_MASIVO_ENVIADO',
      entidad: 'Persona',
      actor: req.actor,
      descripcion: `Correo masivo "${titulo}" enviado a ${result.enviados} destinatario(s)`
        + (result.fallidos > 0 ? ` (${result.fallidos} fallido(s))` : '')
        + (result.descartados > 0 ? ` (${result.descartados} descartado(s) por email inválido)` : ''),
      payload: result,
      request_body: { titulo, texto },
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
  } catch (err) {
    try {
      res.write(`${JSON.stringify({ type: 'error', message: err.message || 'Error al enviar el correo masivo' })}\n`);
      res.end();
    } catch {
      // la conexión ya pudo haberse cerrado
    }
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
