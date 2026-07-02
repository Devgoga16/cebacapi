const mongoose = require('mongoose');
const service = require('../services/chatAulaService');
const Persona = mongoose.models.Persona || require('../models/persona');

const ok = (res, data, message = 'OK', code = 200) =>
  res.status(code).json({ state: 'success', data, message, action_code: code });

const fail = (res, message, code = 400) =>
  res.status(code).json({ state: 'failed', data: null, message, action_code: code });

// GET /chat-aula/:aulaId?page=1&limit=40
exports.getMensajes = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 40);
    const personaId = req.usuarioToken?.id_persona;

    if (!personaId) return fail(res, 'Token sin id_persona — vuelve a iniciar sesión', 401);

    const acceso = await service.verificarAcceso(aulaId, personaId);
    if (!acceso) return fail(res, 'No tienes acceso a este aula', 403);

    const result = await service.getMensajes(aulaId, { page, limit });
    ok(res, result);
  } catch (err) {
    fail(res, err.message, err.status || 500);
  }
};

// POST /chat-aula/:aulaId
exports.enviarMensaje = async (req, res) => {
  try {
    const { aulaId } = req.params;
    const { contenido } = req.body;

    if (!contenido || !contenido.trim()) return fail(res, 'El mensaje no puede estar vacío');

    const personaId = req.usuarioToken?.id_persona;
    if (!personaId) return fail(res, 'Token sin id_persona — vuelve a iniciar sesión', 401);
    const persona   = await Persona.findById(personaId).select('nombres apellido_paterno').lean();
    const nombrePersona = persona
      ? `${persona.nombres || ''} ${persona.apellido_paterno || ''}`.trim()
      : (req.usuarioToken?.username || 'Usuario');

    const mensaje = await service.enviarMensaje(aulaId, personaId, nombrePersona, contenido);
    ok(res, mensaje, 'Mensaje enviado', 201);
  } catch (err) {
    fail(res, err.message, err.status || 500);
  }
};

// DELETE /chat-aula/:aulaId/mensajes/:mensajeId
exports.eliminarMensaje = async (req, res) => {
  try {
    const { mensajeId } = req.params;
    const personaId = req.usuarioToken?.id_persona;

    await service.eliminarMensaje(mensajeId, personaId);
    ok(res, null, 'Mensaje eliminado');
  } catch (err) {
    fail(res, err.message, err.status || 500);
  }
};
