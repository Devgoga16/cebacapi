const mongoose = require('mongoose');
const Reaccion = require('../models/reaccion');
const { TIPOS_REACCION } = require('../models/reaccion');
const notifService = require('./notificacionesService');

/**
 * Crea, actualiza o quita (toggle) la reacción de un usuario sobre una publicación.
 */
exports.reaccionar = async ({ id_publicacion, id_usuario, reaccion }) => {
  if (!TIPOS_REACCION.includes(reaccion)) {
    const err = new Error(`Reacción inválida. Debe ser una de: ${TIPOS_REACCION.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const existente = await Reaccion.findOne({ tipo_entidad: 'Publicacion', id_publicacion, id_usuario });

  if (existente && existente.reaccion === reaccion) {
    await Reaccion.deleteOne({ _id: existente._id });
    notifService.eliminarNotificacionReaccion({ publicacion_id: id_publicacion, actor_id: id_usuario });
    return { accion: 'eliminada', reaccion: null };
  }

  if (existente) {
    existente.reaccion = reaccion;
    await existente.save();
    notifService.notificarReaccion({ publicacion_id: id_publicacion, actor_id: id_usuario, actor_rol: null, reaccion });
    return { accion: 'actualizada', reaccion: existente };
  }

  const nueva = await Reaccion.create({ tipo_entidad: 'Publicacion', id_publicacion, id_usuario, reaccion });
  notifService.notificarReaccion({ publicacion_id: id_publicacion, actor_id: id_usuario, actor_rol: null, reaccion });
  return { accion: 'creada', reaccion: nueva };
};

exports.quitarReaccion = async ({ id_publicacion, id_usuario }) => {
  const result = await Reaccion.deleteOne({ tipo_entidad: 'Publicacion', id_publicacion, id_usuario });
  return { eliminada: result.deletedCount > 0 };
};

exports.getResumen = async (id_publicacion, id_usuario_actual = null) => {
  const conteoPorTipo = await Reaccion.aggregate([
    { $match: { tipo_entidad: 'Publicacion', id_publicacion: new mongoose.Types.ObjectId(id_publicacion) } },
    { $group: { _id: '$reaccion', count: { $sum: 1 } } },
  ]);

  const conteos = TIPOS_REACCION.reduce((acc, tipo) => { acc[tipo] = 0; return acc; }, {});
  let total = 0;
  for (const c of conteoPorTipo) { conteos[c._id] = c.count; total += c.count; }

  let mi_reaccion = null;
  if (id_usuario_actual) {
    const mia = await Reaccion.findOne({ tipo_entidad: 'Publicacion', id_publicacion, id_usuario: id_usuario_actual }).lean();
    mi_reaccion = mia?.reaccion || null;
  }

  return { total, conteos, mi_reaccion };
};

exports.getDetalle = async (id_publicacion) => {
  return await Reaccion.find({ tipo_entidad: 'Publicacion', id_publicacion })
    .populate('id_usuario', 'nombres apellido_paterno apellido_materno')
    .sort({ createdAt: -1 })
    .lean();
};

exports.getResumenMasivo = async (idsPublicaciones) => {
  if (!Array.isArray(idsPublicaciones) || idsPublicaciones.length === 0) return {};

  const objectIds = idsPublicaciones.map(id => new mongoose.Types.ObjectId(id));
  const reacciones = await Reaccion.find({ tipo_entidad: 'Publicacion', id_publicacion: { $in: objectIds } })
    .populate('id_usuario', 'nombres apellido_paterno')
    .sort({ createdAt: -1 })
    .lean();

  const mapa = {};
  for (const id of idsPublicaciones) {
    mapa[String(id)] = {
      total: 0,
      conteos: TIPOS_REACCION.reduce((acc, t) => ({ ...acc, [t]: 0 }), {}),
      detalle: [],
    };
  }

  for (const r of reacciones) {
    const key = String(r.id_publicacion);
    if (!mapa[key]) continue;
    mapa[key].total += 1;
    mapa[key].conteos[r.reaccion] = (mapa[key].conteos[r.reaccion] || 0) + 1;
    mapa[key].detalle.push(r);
  }

  return mapa;
};
