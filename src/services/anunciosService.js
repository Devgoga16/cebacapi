const Anuncio = require('../models/anuncio');
const Usuario = require('../models/usuario');
const Persona = require('../models/persona');
const notificacionesService = require('./notificacionesService');

exports.getAllAnuncios = async () => {
  return await Anuncio.find().populate('id_categoria_anuncio roles id_publicador');
};

exports.getAnuncioById = async (id) => {
  return await Anuncio.findById(id).populate('id_categoria_anuncio roles id_publicador');
};

/**
 * Crea notificaciones in-app para los destinatarios de un anuncio general.
 * Si el anuncio tiene roles definidos, solo se notifica a los usuarios con esos roles.
 * Si no tiene roles (audiencia general), se notifica a todos los usuarios activos.
 * Fire-and-forget: no interrumpe el flujo de creación del anuncio.
 */
async function notificarUsuariosNuevoAnuncio(anuncio) {
  try {
    const filtroUsuario = { active: true };
    if (Array.isArray(anuncio.roles) && anuncio.roles.length > 0) {
      filtroUsuario.roles = { $in: anuncio.roles };
    }

    const usuarios = await Usuario.find(filtroUsuario).select('_id').lean();
    const idsUsuarios = usuarios.map((u) => u._id);
    if (idsUsuarios.length === 0) return;

    const personas = await Persona.find({ id_user: { $in: idsUsuarios } }).select('_id').lean();
    const idsPersonas = personas.map((p) => p._id);
    if (idsPersonas.length === 0) return;

    await notificacionesService.crearNotificacionesMasivas(idsPersonas, {
      tipo: 'ANUNCIO_GENERAL',
      referencia_id: anuncio._id,
      tipo_entidad: 'Anuncio',
      titulo: anuncio.titulo,
      mensaje: anuncio.mensaje,
    });
  } catch (err) {
    console.error('[notificarUsuariosNuevoAnuncio] Error creando notificaciones in-app:', err?.message || err);
  }
}

exports.createAnuncio = async (data) => {
  const anuncio = new Anuncio(data);
  await anuncio.save();

  // Notificación in-app (sin correo) a los destinatarios del anuncio
  notificarUsuariosNuevoAnuncio(anuncio);

  return anuncio;
};

exports.updateAnuncio = async (id, data) => {
  return await Anuncio.findByIdAndUpdate(id, data, { new: true }).populate('id_categoria_anuncio roles id_publicador');
};

exports.deleteAnuncio = async (id) => {
  const result = await Anuncio.findByIdAndDelete(id);
  return !!result;
};
