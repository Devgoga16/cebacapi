const Recurso = require('../models/recurso');
const ComentarioRecurso = require('../models/comentarioRecurso');
const AulaAlumno = require('../models/aulaalumno');
const Notificacion = require('../models/notificacion');
const r2 = require('../services/r2Storage');
const { sendResponse } = require('../utils/helpers');

// Extrae el video ID de YouTube para generar el thumbnail
function youtubeId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ─── RECURSOS ────────────────────────────────────────────────────────────────

exports.listarRecursos = async (req, res, next) => {
  try {
    const { id } = req.params; // id_aula
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const [recursos, total] = await Promise.all([
      Recurso.find({ id_aula: id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('subido_por', 'nombres apellido_paterno'),
      Recurso.countDocuments({ id_aula: id }),
    ]);

    // Quitar el campo archivo.key de la respuesta (interno)
    const data = recursos.map(r => {
      const obj = r.toObject();
      if (obj.archivo) delete obj.archivo.key;
      return obj;
    });

    sendResponse(res, { data: { recursos: data, total, page, limit } });
  } catch (err) { next(err); }
};

exports.subirRecurso = async (req, res, next) => {
  try {
    const { id: id_aula } = req.params;
    const { tipo, titulo, descripcion, url, subido_por } = req.body;

    if (!tipo || !titulo || !subido_por) {
      return sendResponse(res, { state: 'failed', message: 'tipo, titulo y subido_por son requeridos', action_code: 400 });
    }

    let recursoData = { id_aula, subido_por, tipo, titulo, descripcion };

    if (tipo === 'archivo') {
      if (!req.file) return sendResponse(res, { state: 'failed', message: 'Se requiere un archivo', action_code: 400 });
      const { key } = await r2.uploadBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);
      recursoData.archivo = {
        key,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      };
    } else if (tipo === 'link') {
      if (!url) return sendResponse(res, { state: 'failed', message: 'Se requiere url para tipo link', action_code: 400 });
      recursoData.url = url;
      const vid = youtubeId(url);
      if (vid) recursoData.url_thumbnail = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
    } else {
      return sendResponse(res, { state: 'failed', message: 'tipo debe ser archivo o link', action_code: 400 });
    }

    const recurso = await (await Recurso.create(recursoData)).populate('subido_por', 'nombres apellido_paterno');

    // Notificar a todos los alumnos activos del aula
    const estadosActivos = ['inscrito', 'en curso', 'aprobado'];
    const alumnos = await AulaAlumno.find({ id_aula, estado: { $in: estadosActivos } }).select('id_alumno');

    if (alumnos.length > 0) {
      const notifs = alumnos.map(a => ({
        destinatario_id: a.id_alumno,
        tipo: 'recurso',
        recurso_id: recurso._id,
        actor_id: subido_por,
        mensaje: `Nuevo recurso disponible: ${titulo}`,
        leida: false,
      }));
      await Notificacion.insertMany(notifs, { ordered: false });
    }

    const obj = recurso.toObject();
    if (obj.archivo) delete obj.archivo.key;
    sendResponse(res, { data: obj, message: 'Recurso subido', action_code: 201 });
  } catch (err) { next(err); }
};

exports.obtenerUrlDescarga = async (req, res, next) => {
  try {
    const recurso = await Recurso.findById(req.params.id);
    if (!recurso || recurso.tipo !== 'archivo') {
      return sendResponse(res, { state: 'failed', message: 'Recurso no encontrado', action_code: 404 });
    }
    const url = await r2.getDownloadUrl(recurso.archivo.key);
    sendResponse(res, { data: { url, filename: recurso.archivo.filename } });
  } catch (err) { next(err); }
};

exports.eliminarRecurso = async (req, res, next) => {
  try {
    const recurso = await Recurso.findById(req.params.id);
    if (!recurso) return sendResponse(res, { state: 'failed', message: 'Recurso no encontrado', action_code: 404 });

    if (recurso.tipo === 'archivo' && recurso.archivo?.key) {
      await r2.deleteObject(recurso.archivo.key).catch(() => {}); // no bloquear si falla R2
    }

    await recurso.deleteOne();
    await Notificacion.deleteMany({ recurso_id: recurso._id });
    sendResponse(res, { data: null, message: 'Recurso eliminado' });
  } catch (err) { next(err); }
};

// ─── COMENTARIOS ─────────────────────────────────────────────────────────────

exports.listarComentarios = async (req, res, next) => {
  try {
    const todos = await ComentarioRecurso.find({
      id_recurso: req.params.id,
      eliminado: false,
    }).sort({ createdAt: 1 }).lean();

    // Armar árbol: root comments + replies anidadas
    const roots = [];
    const map = {};
    todos.forEach(c => { map[c._id] = { ...c, replies: [] }; });
    todos.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });

    sendResponse(res, { data: roots });
  } catch (err) { next(err); }
};

exports.crearComentario = async (req, res, next) => {
  try {
    const { autor_id, autor_nombre, autor_rol, texto, parent_id } = req.body;
    if (!autor_id || !autor_nombre || !autor_rol || !texto) {
      return sendResponse(res, { state: 'failed', message: 'Faltan campos requeridos', action_code: 400 });
    }

    const comentario = await ComentarioRecurso.create({
      id_recurso: req.params.id,
      autor_id, autor_nombre, autor_rol, texto,
      parent_id: parent_id || null,
    });

    // Notificaciones asíncronas (fire-and-forget)
    notificarComentarioRecurso({ recursoId: req.params.id, autorId: autor_id, autorRol: autor_rol, texto, parentId: parent_id || null }).catch(() => {});

    sendResponse(res, { data: { ...comentario.toObject(), replies: [] }, message: 'Comentario agregado', action_code: 201 });
  } catch (err) { next(err); }
};

async function notificarComentarioRecurso({ recursoId, autorId, autorRol, texto, parentId }) {
  const recurso = await Recurso.findById(recursoId).select('subido_por titulo id_aula');
  if (!recurso) return;

  const docenteId = String(recurso.subido_por);
  const notifs = [];
  const snippet = `"${texto.slice(0, 60)}${texto.length > 60 ? '…' : ''}"`;

  if (parentId) {
    // Es una respuesta a otro comentario → notificar al autor del comentario padre
    const padre = await ComentarioRecurso.findById(parentId).select('autor_id');
    if (padre && String(padre.autor_id) !== String(autorId)) {
      notifs.push({
        destinatario_id: padre.autor_id,
        tipo: 'recurso',
        recurso_id: recursoId,
        actor_id: autorId,
        mensaje: `respondió a tu comentario en "${recurso.titulo}": ${snippet}`,
        leida: false,
      });
    }
  } else if (autorRol !== 'Docente') {
    // Comentario raíz de estudiante → notificar al docente que subió el recurso
    if (docenteId !== String(autorId)) {
      notifs.push({
        destinatario_id: docenteId,
        tipo: 'recurso',
        recurso_id: recursoId,
        actor_id: autorId,
        mensaje: `comentó en tu recurso "${recurso.titulo}": ${snippet}`,
        leida: false,
      });
    }
  } else {
    // Comentario raíz del docente → notificar a todos los que han comentado antes (sin duplicar)
    const previos = await ComentarioRecurso.find({ id_recurso: recursoId, eliminado: false, autor_id: { $ne: autorId } })
      .distinct('autor_id');
    previos.forEach(uid => {
      notifs.push({
        destinatario_id: uid,
        tipo: 'recurso',
        recurso_id: recursoId,
        actor_id: autorId,
        mensaje: `respondió en el recurso "${recurso.titulo}": ${snippet}`,
        leida: false,
      });
    });
  }

  if (notifs.length > 0) {
    await Notificacion.insertMany(notifs, { ordered: false });
  }
}

exports.eliminarComentario = async (req, res, next) => {
  try {
    const comentario = await ComentarioRecurso.findByIdAndUpdate(
      req.params.id,
      { eliminado: true },
      { new: true },
    );
    if (!comentario) return sendResponse(res, { state: 'failed', message: 'Comentario no encontrado', action_code: 404 });
    sendResponse(res, { data: null, message: 'Comentario eliminado' });
  } catch (err) { next(err); }
};
