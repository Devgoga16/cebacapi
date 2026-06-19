const Notificacion = require('../models/notificacion');

/**
 * Crea una notificación individual.
 */
exports.crearNotificacion = async ({ id_usuario, tipo, referencia_id = null, titulo, mensaje }) => {
  return await Notificacion.create({ id_usuario, tipo, referencia_id, titulo, mensaje });
};

/**
 * Crea una notificación para cada usuario de la lista (inserción masiva).
 * @param {string[]} idsUsuarios
 * @param {{ tipo: string, referencia_id?: string, titulo: string, mensaje: string }} datosComunes
 */
exports.crearNotificacionesMasivas = async (idsUsuarios, { tipo, referencia_id = null, titulo, mensaje }) => {
  if (!Array.isArray(idsUsuarios) || idsUsuarios.length === 0) return [];

  const docs = idsUsuarios.map((id_usuario) => ({
    id_usuario,
    tipo,
    referencia_id,
    titulo,
    mensaje,
  }));

  const result = await Notificacion.insertMany(docs, { ordered: false });
  return result;
};

/**
 * Lista las notificaciones de un usuario, opcionalmente filtradas por leído, con paginación.
 */
exports.getNotificacionesPorUsuario = async (id_usuario, { leido, page = 1, limit = 20 } = {}) => {
  const filter = { id_usuario };
  if (leido !== undefined) {
    filter.leido = leido === 'true' || leido === true;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [notificaciones, total, noLeidas] = await Promise.all([
    Notificacion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Notificacion.countDocuments(filter),
    Notificacion.countDocuments({ id_usuario, leido: false }),
  ]);

  return {
    notificaciones,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
      no_leidas: noLeidas,
    },
  };
};

/**
 * Cuenta las notificaciones no leídas de un usuario (para el badge de la campanita).
 */
exports.contarNoLeidas = async (id_usuario) => {
  const count = await Notificacion.countDocuments({ id_usuario, leido: false });
  return { no_leidas: count };
};

/**
 * Marca una notificación específica como leída.
 */
exports.marcarLeida = async (id) => {
  return await Notificacion.findByIdAndUpdate(
    id,
    { leido: true, fecha_leido: new Date() },
    { new: true }
  );
};

/**
 * Marca todas las notificaciones de un usuario como leídas.
 */
exports.marcarTodasLeidas = async (id_usuario) => {
  const result = await Notificacion.updateMany(
    { id_usuario, leido: false },
    { leido: true, fecha_leido: new Date() }
  );
  return { modificadas: result.modifiedCount };
};
