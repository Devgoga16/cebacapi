const mongoose = require('mongoose');
const Reaccion = require('../models/reaccion');
const { TIPOS_REACCION } = require('../models/reaccion');
const AnuncioProfesor = require('../models/anuncioProfesor');
const Anuncio = require('../models/anuncio');
const Persona = require('../models/persona');
const notificacionesService = require('./notificacionesService');

const EMOJI_REACCION = {
  me_gusta: '👍',
  me_encanta: '😍',
  me_asombra: '😲',
  me_bendice: '🙏',
};

/**
 * Resuelve quién es el "dueño" de un anuncio (a quién hay que notificarle si alguien reacciona)
 * y datos de contexto útiles para construir la notificación.
 */
async function resolverDuenioDeAnuncio(tipo_entidad, id_anuncio) {
  if (tipo_entidad === 'AnuncioProfesor') {
    const anuncio = await AnuncioProfesor.findById(id_anuncio).lean();
    if (!anuncio) return null;
    return { id_dueno: anuncio.id_profesor, id_aula: anuncio.id_aula, titulo: anuncio.titulo };
  }

  if (tipo_entidad === 'Anuncio') {
    const anuncio = await Anuncio.findById(id_anuncio).lean();
    if (!anuncio) return null;
    return { id_dueno: anuncio.id_publicador, id_aula: null, titulo: anuncio.titulo };
  }

  return null;
}

/**
 * Notifica (in-app, sin correo) al dueño del anuncio cuando alguien reacciona.
 * Fire-and-forget: no interrumpe el flujo de la reacción.
 */
async function notificarDuenioReaccion({ tipo_entidad, id_anuncio, id_usuario_que_reacciono, reaccion }) {
  try {
    const contexto = await resolverDuenioDeAnuncio(tipo_entidad, id_anuncio);
    if (!contexto?.id_dueno) return;

    // No notificar si el usuario reacciona a su propio anuncio
    if (String(contexto.id_dueno) === String(id_usuario_que_reacciono)) return;

    const persona = await Persona.findById(id_usuario_que_reacciono).select('nombres apellido_paterno').lean();
    const nombre = persona ? `${persona.nombres} ${persona.apellido_paterno}`.trim() : 'Alguien';
    const emoji = EMOJI_REACCION[reaccion] || '';

    await notificacionesService.crearNotificacion({
      id_usuario: contexto.id_dueno,
      tipo: 'REACCION_ANUNCIO',
      referencia_id: id_anuncio,
      tipo_entidad, // 'AnuncioProfesor' o 'Anuncio' — indispensable para que el frontend sepa qué detalle pedir
      id_aula: contexto.id_aula,
      titulo: `Nueva reacción en "${contexto.titulo}"`,
      mensaje: `${nombre} reaccionó ${emoji} a tu anuncio`,
    });
  } catch (err) {
    console.error('[notificarDuenioReaccion] Error creando notificación:', err?.message || err);
  }
}

/**
 * Crea, actualiza o quita (toggle) la reacción de un usuario sobre un anuncio.
 * - Si el usuario no tenía reacción -> la crea.
 * - Si tenía una reacción distinta -> la actualiza.
 * - Si tenía la MISMA reacción -> la quita (toggle off).
 * @returns {{ accion: 'creada'|'actualizada'|'eliminada', reaccion: object|null }}
 */
exports.reaccionar = async ({ tipo_entidad, id_anuncio, id_usuario, reaccion }) => {
  if (!TIPOS_REACCION.includes(reaccion)) {
    const err = new Error(`Reacción inválida. Debe ser una de: ${TIPOS_REACCION.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const existente = await Reaccion.findOne({ tipo_entidad, id_anuncio, id_usuario });

  if (existente && existente.reaccion === reaccion) {
    await Reaccion.deleteOne({ _id: existente._id });
    return { accion: 'eliminada', reaccion: null };
  }

  if (existente) {
    existente.reaccion = reaccion;
    await existente.save();
    notificarDuenioReaccion({ tipo_entidad, id_anuncio, id_usuario_que_reacciono: id_usuario, reaccion });
    return { accion: 'actualizada', reaccion: existente };
  }

  const nueva = await Reaccion.create({ tipo_entidad, id_anuncio, id_usuario, reaccion });
  notificarDuenioReaccion({ tipo_entidad, id_anuncio, id_usuario_que_reacciono: id_usuario, reaccion });
  return { accion: 'creada', reaccion: nueva };
};

/**
 * Quita explícitamente la reacción de un usuario sobre un anuncio.
 */
exports.quitarReaccion = async ({ tipo_entidad, id_anuncio, id_usuario }) => {
  const result = await Reaccion.deleteOne({ tipo_entidad, id_anuncio, id_usuario });
  return { eliminada: result.deletedCount > 0 };
};

/**
 * Resumen de reacciones de un anuncio: conteo por tipo + total + la reacción del usuario actual (si se indica).
 */
exports.getResumen = async (tipo_entidad, id_anuncio, id_usuario_actual = null) => {
  const conteoPorTipo = await Reaccion.aggregate([
    { $match: { tipo_entidad, id_anuncio: new mongoose.Types.ObjectId(id_anuncio) } },
    { $group: { _id: '$reaccion', count: { $sum: 1 } } },
  ]);

  const conteos = TIPOS_REACCION.reduce((acc, tipo) => {
    acc[tipo] = 0;
    return acc;
  }, {});
  let total = 0;
  for (const c of conteoPorTipo) {
    conteos[c._id] = c.count;
    total += c.count;
  }

  let mi_reaccion = null;
  if (id_usuario_actual) {
    const mia = await Reaccion.findOne({ tipo_entidad, id_anuncio, id_usuario: id_usuario_actual }).lean();
    mi_reaccion = mia?.reaccion || null;
  }

  return { total, conteos, mi_reaccion };
};

/**
 * Lista el detalle de quién reaccionó y con qué (para mostrar "Juan y 5 más reaccionaron con 👍").
 */
exports.getDetalle = async (tipo_entidad, id_anuncio) => {
  return await Reaccion.find({ tipo_entidad, id_anuncio })
    .populate('id_usuario', 'nombres apellido_paterno apellido_materno')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Resumen + detalle de reacciones para VARIOS anuncios a la vez (evita N+1 queries en listados).
 * @param {string} tipo_entidad
 * @param {string[]} idsAnuncios
 * @returns {Object} mapa { [id_anuncio]: { total, conteos, detalle } }
 */
exports.getResumenYDetalleMasivo = async (tipo_entidad, idsAnuncios) => {
  if (!Array.isArray(idsAnuncios) || idsAnuncios.length === 0) return {};

  const objectIds = idsAnuncios.map((id) => new mongoose.Types.ObjectId(id));
  const reacciones = await Reaccion.find({ tipo_entidad, id_anuncio: { $in: objectIds } })
    .populate('id_usuario', 'nombres apellido_paterno apellido_materno')
    .sort({ createdAt: -1 })
    .lean();

  const mapa = {};
  for (const idAnuncio of idsAnuncios) {
    mapa[String(idAnuncio)] = {
      total: 0,
      conteos: TIPOS_REACCION.reduce((acc, tipo) => ({ ...acc, [tipo]: 0 }), {}),
      detalle: [],
    };
  }

  for (const r of reacciones) {
    const key = String(r.id_anuncio);
    if (!mapa[key]) continue;
    mapa[key].total += 1;
    mapa[key].conteos[r.reaccion] = (mapa[key].conteos[r.reaccion] || 0) + 1;
    mapa[key].detalle.push(r);
  }

  return mapa;
};
