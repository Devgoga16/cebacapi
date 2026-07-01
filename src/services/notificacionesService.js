const Notificacion = require('../models/notificacion');
const Publicacion = require('../models/publicacion');
const Persona = require('../models/persona');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol');

/**
 * Crea notificaciones cuando alguien reacciona a una publicación.
 * No notifica al propio autor si reacciona a su post.
 */
exports.notificarReaccion = async ({ publicacion_id, actor_id, actor_rol, reaccion }) => {
  try {
    const pub = await Publicacion.findById(publicacion_id).select('autor_id').lean();
    if (!pub) return;
    if (String(pub.autor_id) === String(actor_id)) return; // no auto-notificar

    const emojis = { me_gusta: '👍', me_encanta: '❤️', me_asombra: '😲', me_bendice: '🙏' };
    await Notificacion.create({
      destinatario_id: pub.autor_id,
      tipo: 'reaccion',
      publicacion_id,
      actor_id,
      actor_rol,
      mensaje: `reaccionó con ${emojis[reaccion] || reaccion} a tu publicación`,
    });
  } catch { /* no interrumpir el flujo principal */ }
};

/**
 * Crea notificación cuando alguien comenta una publicación.
 */
exports.notificarComentario = async ({ publicacion_id, actor_id, actor_rol }) => {
  try {
    const pub = await Publicacion.findById(publicacion_id).select('autor_id').lean();
    if (!pub) return;
    if (String(pub.autor_id) === String(actor_id)) return;

    await Notificacion.create({
      destinatario_id: pub.autor_id,
      tipo: 'comentario',
      publicacion_id,
      actor_id,
      actor_rol,
      mensaje: 'comentó tu publicación',
    });
  } catch {}
};

// Obtiene Persona IDs para un conjunto de nombres de roles (ej. ['Docente', 'Estudiante'])
async function getPersonaIdsPorRoles(nombresRoles) {
  const roles = await Rol.find({ nombre_rol: { $in: nombresRoles } }).select('_id').lean();
  const roleIds = roles.map(r => r._id);
  if (!roleIds.length) return [];
  const usuarios = await Usuario.find({ roles: { $in: roleIds } }).select('_id').lean();
  const usuarioIds = usuarios.map(u => u._id);
  if (!usuarioIds.length) return [];
  const personas = await Persona.find({ id_user: { $in: usuarioIds } }).select('_id').lean();
  return personas.map(p => p._id);
}

/**
 * Crea notificaciones para cada destinatario de una nueva publicación.
 * - destinatarios: Persona IDs pre-computados (visibilidad relacional)
 * - visibilidad: objeto {tipo, roles_destino} para fan-out de visibilidad global por rol
 */
exports.notificarNuevaPublicacion = async ({ publicacion_id, autor_id, autor_rol, destinatarios = [], visibilidad = {} }) => {
  try {
    console.log('[notif] notificarNuevaPublicacion llamado, tipo:', visibilidad.tipo, 'destinatarios:', destinatarios.length);
    let ids = [...destinatarios];

    // Fan-out por roles para visibilidades globales
    const { tipo, roles_destino = [] } = visibilidad;
    // Mapea los nombres del feed (capitalizados) a los nombres reales en BD (minúsculas)
    const feedRolToDb = { Admin: 'admin', Coordinador: 'coordinador', Docente: 'docente', Estudiante: 'estudiante' };

    if (tipo === 'roles_globales' && roles_destino.length) {
      const dbRoles = roles_destino.map(r => feedRolToDb[r] || r.toLowerCase()).filter(Boolean);
      const extra = await getPersonaIdsPorRoles(dbRoles);
      ids = [...ids, ...extra];
    } else if (tipo === 'coordinadores_global') {
      const extra = await getPersonaIdsPorRoles(['coordinador']);
      ids = [...ids, ...extra];
    } else if (tipo === 'docentes_global') {
      const extra = await getPersonaIdsPorRoles(['docente']);
      ids = [...ids, ...extra];
    } else if (tipo === 'estudiantes_global') {
      const extra = await getPersonaIdsPorRoles(['estudiante']);
      ids = [...ids, ...extra];
    }

    // Deduplicar y excluir al autor
    const autorStr = String(autor_id);
    const vistos = new Set();
    const docs = [];
    for (const id of ids) {
      const key = String(id);
      if (key === autorStr || vistos.has(key)) continue;
      vistos.add(key);
      docs.push({
        destinatario_id: id,
        tipo: 'publicacion',
        publicacion_id,
        actor_id: autor_id,
        actor_rol: autor_rol,
        mensaje: 'publicó algo nuevo para ti',
      });
    }
    console.log('[notif] docs a insertar:', docs.length);
    if (docs.length > 0) await Notificacion.insertMany(docs, { ordered: false });
    console.log('[notif] notificaciones de publicacion creadas OK:', docs.length);
  } catch (err) {
    console.error('[notif] ERROR en notificarNuevaPublicacion:', err.message, err.stack?.slice(0, 300));
  }
};

/**
 * Elimina notificaciones de reacción cuando el usuario quita su reacción.
 */
exports.eliminarNotificacionReaccion = async ({ publicacion_id, actor_id }) => {
  try {
    await Notificacion.deleteOne({ tipo: 'reaccion', publicacion_id, actor_id });
  } catch {}
};

// ── Consultas ─────────────────────────────────────────────────────────────────

exports.getNotificaciones = async (destinatario_id, { page = 1, limit = 20, soloNoLeidas = false } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const filtro = { destinatario_id };
  if (soloNoLeidas) filtro.leida = false;

  const [items, total, noLeidas] = await Promise.all([
    Notificacion.find(filtro)
      .populate('actor_id', 'nombres apellido_paterno imagen')
      .populate('publicacion_id', 'contenido autor_rol')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notificacion.countDocuments(filtro),
    Notificacion.countDocuments({ destinatario_id, leida: false }),
  ]);

  return { items, total, noLeidas, pages: Math.ceil(total / Number(limit)) };
};

exports.marcarLeida = async (id, destinatario_id) => {
  return Notificacion.findOneAndUpdate(
    { _id: id, destinatario_id },
    { leida: true },
    { new: true },
  );
};

exports.marcarTodasLeidas = async (destinatario_id) => {
  await Notificacion.updateMany({ destinatario_id, leida: false }, { leida: true });
};

exports.contarNoLeidas = async (destinatario_id) => {
  return Notificacion.countDocuments({ destinatario_id, leida: false });
};

exports.eliminarNotificacionesPublicacion = async (publicacion_id) => {
  await Notificacion.deleteMany({ publicacion_id });
};
