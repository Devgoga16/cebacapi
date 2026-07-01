const feedService = require('../services/feedService');
const reaccionesService = require('../services/reaccionesService');
const { sendResponse } = require('../utils/helpers');

// ── Feed ──────────────────────────────────────────────────────────────────────

exports.getFeed = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const { page, limit } = req.query;
    const data = await feedService.getFeed(id_persona, { page, limit });
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.crearPublicacion = async (req, res, next) => {
  try {
    const { autor_id, autor_rol, contenido, archivos, visibilidad, formato } = req.body || {};
    if (!autor_id || !autor_rol || !visibilidad?.tipo) {
      return sendResponse(res, { state: 'failed', data: null, message: 'autor_id, autor_rol y visibilidad.tipo son requeridos', action_code: 400 });
    }
    const pub = await feedService.crearPublicacion({ autor_id, autor_rol, contenido, archivos, visibilidad, formato });
    sendResponse(res, { data: pub, message: 'Publicación creada' });
  } catch (err) { next(err); }
};

exports.marcarAnuncioVisto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { persona_id } = req.body || {};
    if (!persona_id) return sendResponse(res, { state: 'failed', data: null, message: 'persona_id requerido', action_code: 400 });
    await feedService.marcarAnuncioVisto(id, persona_id);
    sendResponse(res, { data: null, message: 'Anuncio marcado como visto' });
  } catch (err) { next(err); }
};

exports.eliminarPublicacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const personaId = req.actor?.id_persona || req.query.id_persona;
    const result = await feedService.eliminarPublicacion(id, personaId);
    if (!result) return sendResponse(res, { state: 'failed', data: null, message: 'Publicación no encontrada', action_code: 404 });
    sendResponse(res, { data: null, message: 'Publicación eliminada' });
  } catch (err) { next(err); }
};

exports.getMisAulas = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const { rol } = req.query;
    const data = await feedService.getMisAulas(id_persona, rol);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

// ── Comentarios ───────────────────────────────────────────────────────────────

exports.getComentarios = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    const data = await feedService.getComentarios(id, { page, limit });
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.agregarComentario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { autor_id, autor_rol, contenido } = req.body || {};
    if (!autor_id || !autor_rol || !contenido?.trim()) {
      return sendResponse(res, { state: 'failed', data: null, message: 'autor_id, autor_rol y contenido son requeridos', action_code: 400 });
    }
    const comentario = await feedService.agregarComentario({ publicacion_id: id, autor_id, autor_rol, contenido });
    const populated = await comentario.populate('autor_id', 'nombres apellido_paterno imagen');
    sendResponse(res, { data: populated, message: 'Comentario agregado' });
  } catch (err) { next(err); }
};

exports.eliminarComentario = async (req, res, next) => {
  try {
    const { comentarioId } = req.params;
    const personaId = req.actor?.id_persona || req.query.id_persona;
    const result = await feedService.eliminarComentario(comentarioId, personaId);
    if (!result) return sendResponse(res, { state: 'failed', data: null, message: 'Comentario no encontrado', action_code: 404 });
    sendResponse(res, { data: null, message: 'Comentario eliminado' });
  } catch (err) { next(err); }
};

// ── Reacciones ────────────────────────────────────────────────────────────────

exports.reaccionar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id_usuario, reaccion } = req.body || {};
    if (!id_usuario || !reaccion) {
      return sendResponse(res, { state: 'failed', data: null, message: 'id_usuario y reaccion son requeridos', action_code: 400 });
    }
    const resultado = await reaccionesService.reaccionar({ id_publicacion: id, id_usuario, reaccion });
    sendResponse(res, { data: resultado, message: `Reacción ${resultado.accion}` });
  } catch (err) { next(err); }
};

exports.getReaccionesSummary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id_usuario } = req.query;
    const data = await reaccionesService.getResumen(id, id_usuario);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.getReaccionesDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await reaccionesService.getDetalle(id);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};
