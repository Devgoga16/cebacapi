const mongoose = require('mongoose');
const Publicacion = require('../models/publicacion');
const Comentario = require('../models/comentario');
const Aula = require('../models/aula');
const AulaAlumno = require('../models/aulaalumno');
const Persona = require('../models/persona');
const Usuario = require('../models/usuario');
const Rol = require('../models/rol');
const Reaccion = require('../models/reaccion');
const AnuncioVisto = require('../models/anuncioVisto');
const reaccionesService = require('./reaccionesService');
const notifService = require('./notificacionesService');

// Mapea nombre_rol de BD al enum del feed
function mapRolNombre(nombre) {
  const n = (nombre || '').toLowerCase();
  if (n === 'admin' || n === 'administrador') return 'Admin';
  if (n === 'coordinador') return 'Coordinador';
  if (n === 'docente' || n === 'profesor') return 'Docente';
  if (n === 'estudiante' || n === 'alumno') return 'Estudiante';
  return null;
}

async function getRolesParaPersona(personaId) {
  const persona = await Persona.findById(personaId).select('id_user').lean();
  if (!persona?.id_user) return [];
  const usuario = await Usuario.findById(persona.id_user).populate('roles', 'nombre_rol').lean();
  if (!usuario?.roles) return [];
  return usuario.roles.map(r => mapRolNombre(r.nombre_rol)).filter(Boolean);
}

// Pre-computa las personas que pueden ver la publicación (visibilidad relacional)
async function computeDestinatarios(autorId, tipo, aulasDestino = []) {
  const ESTADOS_ACTIVOS = ['en curso', 'inscrito', 'aprobado', 'pendiente'];

  if (tipo === 'mis_docentes') {
    const aulas = await Aula.find({ id_coordinador: autorId }).select('id_profesor').lean();
    const ids = [...new Set(aulas.map(a => String(a.id_profesor)).filter(Boolean))];
    return ids.map(id => new mongoose.Types.ObjectId(id));
  }

  if (tipo === 'mis_estudiantes_coord') {
    const aulas = await Aula.find({ id_coordinador: autorId }).select('_id').lean();
    const aulaIds = aulas.map(a => a._id);
    const rels = await AulaAlumno.find({ id_aula: { $in: aulaIds }, estado: { $in: ESTADOS_ACTIVOS } }).select('id_alumno').lean();
    const ids = [...new Set(rels.map(r => String(r.id_alumno)))];
    return ids.map(id => new mongoose.Types.ObjectId(id));
  }

  if (tipo === 'mis_estudiantes') {
    const aulas = await Aula.find({ id_profesor: autorId }).select('_id').lean();
    const aulaIds = aulas.map(a => a._id);
    const rels = await AulaAlumno.find({ id_aula: { $in: aulaIds }, estado: { $in: ESTADOS_ACTIVOS } }).select('id_alumno').lean();
    const ids = [...new Set(rels.map(r => String(r.id_alumno)))];
    return ids.map(id => new mongoose.Types.ObjectId(id));
  }

  if (tipo === 'aula_especifica') {
    const aulas = await Aula.find({ _id: { $in: aulasDestino } }).select('id_profesor id_coordinador').lean();
    const rels = await AulaAlumno.find({ id_aula: { $in: aulasDestino }, estado: { $in: ESTADOS_ACTIVOS } }).select('id_alumno').lean();
    const ids = new Set(rels.map(r => String(r.id_alumno)));
    aulas.forEach(a => {
      if (a.id_profesor) ids.add(String(a.id_profesor));
      if (a.id_coordinador) ids.add(String(a.id_coordinador));
    });
    ids.delete(String(autorId));
    return [...ids].map(id => new mongoose.Types.ObjectId(id));
  }

  if (tipo === 'mi_aula') {
    const misAulas = await AulaAlumno.find({ id_alumno: autorId, estado: { $in: ESTADOS_ACTIVOS } }).select('id_aula').lean();
    const aulaIds = misAulas.map(a => a.id_aula);
    const [aulas, rels] = await Promise.all([
      Aula.find({ _id: { $in: aulaIds } }).select('id_profesor id_coordinador').lean(),
      AulaAlumno.find({ id_aula: { $in: aulaIds }, id_alumno: { $ne: autorId }, estado: { $in: ESTADOS_ACTIVOS } }).select('id_alumno').lean(),
    ]);
    const ids = new Set(rels.map(r => String(r.id_alumno)));
    aulas.forEach(a => {
      if (a.id_profesor) ids.add(String(a.id_profesor));
      if (a.id_coordinador) ids.add(String(a.id_coordinador));
    });
    ids.delete(String(autorId));
    return [...ids].map(id => new mongoose.Types.ObjectId(id));
  }

  return [];
}

function buildVisibilidadLabel(tipo, rolesDestino = [], aulasNombres = []) {
  const labels = {
    coordinadores_global: 'Todos los coordinadores',
    docentes_global: 'Todos los docentes',
    mis_docentes: 'Mis docentes',
    mis_estudiantes_coord: 'Mis estudiantes',
    mis_estudiantes: 'Mis estudiantes',
    estudiantes_global: 'Todos los estudiantes',
    mi_aula: 'Mi aula',
  };
  if (tipo === 'roles_globales') {
    return rolesDestino.join(', ') || 'Roles seleccionados';
  }
  if (tipo === 'aula_especifica') {
    return aulasNombres.length > 0 ? aulasNombres.join(', ') : 'Aula específica';
  }
  return labels[tipo] || tipo;
}

// ── Crear publicación ─────────────────────────────────────────────────────────

exports.crearPublicacion = async ({ autor_id, autor_rol, contenido, archivos = [], visibilidad, formato = 'publicacion' }) => {
  const { tipo, roles_destino = [], aulas_destino = [] } = visibilidad;

  // Pre-computar destinatarios para visibilidad relacional
  const destinatarios = await computeDestinatarios(autor_id, tipo, aulas_destino);

  // Label legible
  let aulasNombres = [];
  if (tipo === 'aula_especifica' && aulas_destino.length > 0) {
    const aulas = await Aula.find({ _id: { $in: aulas_destino } }).populate('id_curso', 'nombre').lean();
    aulasNombres = aulas.map(a => a.id_curso?.nombre || 'Aula');
  }
  const label = buildVisibilidadLabel(tipo, roles_destino, aulasNombres);

  const pub = await Publicacion.create({
    autor_id,
    autor_rol,
    formato,
    contenido,
    archivos,
    visibilidad: { tipo, roles_destino, aulas_destino, label },
    destinatarios,
  });

  // Notificar: relacionales (destinatarios pre-computados) + globales por rol
  notifService.notificarNuevaPublicacion({
    publicacion_id: pub._id,
    autor_id,
    autor_rol,
    destinatarios,
    visibilidad: { tipo, roles_destino },
  });

  return pub;
};

// ── Obtener feed ──────────────────────────────────────────────────────────────

exports.getFeed = async (personaId, { page = 1, limit = 15 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const roles = await getRolesParaPersona(personaId);

  const conditions = [
    { autor_id: personaId },
    { destinatarios: personaId },
  ];

  if (roles.includes('Admin')) {
    conditions.push({ 'visibilidad.tipo': 'roles_globales', 'visibilidad.roles_destino': 'Admin' });
  }
  if (roles.includes('Coordinador')) {
    conditions.push({ 'visibilidad.tipo': 'coordinadores_global' });
    conditions.push({ 'visibilidad.tipo': 'roles_globales', 'visibilidad.roles_destino': 'Coordinador' });
  }
  if (roles.includes('Docente')) {
    conditions.push({ 'visibilidad.tipo': 'docentes_global' });
    conditions.push({ 'visibilidad.tipo': 'roles_globales', 'visibilidad.roles_destino': 'Docente' });
  }
  if (roles.includes('Estudiante')) {
    conditions.push({ 'visibilidad.tipo': 'estudiantes_global' });
    conditions.push({ 'visibilidad.tipo': 'roles_globales', 'visibilidad.roles_destino': 'Estudiante' });
  }

  // Excluir anuncios ya vistos por este usuario
  const anunciosVistos = await AnuncioVisto.find({ persona_id: personaId }).distinct('publicacion_id');
  const query = {
    $and: [
      { $or: conditions },
      {
        $or: [
          { formato: { $ne: 'anuncio' } },
          { formato: { $exists: false } },
          { _id: { $nin: anunciosVistos } },
        ],
      },
    ],
  };

  const [publicaciones, total] = await Promise.all([
    Publicacion.find(query)
      .populate('autor_id', 'nombres apellido_paterno imagen')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Publicacion.countDocuments(query),
  ]);

  // Enriquecer con reacciones (batch)
  const ids = publicaciones.map(p => String(p._id));
  const reaccionesMap = await reaccionesService.getResumenMasivo(ids);

  // Enriquecer con conteo de comentarios
  const comentariosConteo = await Comentario.aggregate([
    { $match: { publicacion_id: { $in: publicaciones.map(p => p._id) } } },
    { $group: { _id: '$publicacion_id', count: { $sum: 1 } } },
  ]);
  const comentariosMap = Object.fromEntries(comentariosConteo.map(c => [String(c._id), c.count]));

  const items = publicaciones.map(p => ({
    ...p,
    reacciones: reaccionesMap[String(p._id)] || { total: 0, conteos: {}, detalle: [] },
    comentarios_count: comentariosMap[String(p._id)] || 0,
  }));

  return {
    items,
    meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  };
};

// ── Obtener publicación individual ────────────────────────────────────────────

exports.getPublicacion = async (id) => {
  return await Publicacion.findById(id)
    .populate('autor_id', 'nombres apellido_paterno imagen')
    .lean();
};

// ── Eliminar publicación ──────────────────────────────────────────────────────

exports.eliminarPublicacion = async (id, personaId) => {
  const pub = await Publicacion.findById(id).lean();
  if (!pub) return null;
  if (String(pub.autor_id) !== String(personaId)) {
    const err = new Error('No tienes permiso para eliminar esta publicación');
    err.statusCode = 403;
    throw err;
  }
  await Promise.all([
    Publicacion.findByIdAndDelete(id),
    Comentario.deleteMany({ publicacion_id: id }),
    Reaccion.deleteMany({ id_publicacion: id }),
    AnuncioVisto.deleteMany({ publicacion_id: id }),
    notifService.eliminarNotificacionesPublicacion(id),
  ]);
  return true;
};

// ── Comentarios ───────────────────────────────────────────────────────────────

exports.agregarComentario = async ({ publicacion_id, autor_id, autor_rol, contenido }) => {
  const comentario = await Comentario.create({ publicacion_id, autor_id, autor_rol, contenido });
  notifService.notificarComentario({ publicacion_id, actor_id: autor_id, actor_rol: autor_rol });
  return comentario;
};

exports.getComentarios = async (publicacion_id, { page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [comentarios, total] = await Promise.all([
    Comentario.find({ publicacion_id })
      .populate('autor_id', 'nombres apellido_paterno imagen')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Comentario.countDocuments({ publicacion_id }),
  ]);
  return { comentarios, total, pages: Math.ceil(total / Number(limit)) };
};

exports.eliminarComentario = async (comentarioId, personaId) => {
  const c = await Comentario.findById(comentarioId).lean();
  if (!c) return null;
  if (String(c.autor_id) !== String(personaId)) {
    const err = new Error('No tienes permiso para eliminar este comentario');
    err.statusCode = 403;
    throw err;
  }
  await Comentario.findByIdAndDelete(comentarioId);
  return true;
};

// ── Anuncio visto ─────────────────────────────────────────────────────────────

exports.marcarAnuncioVisto = async (publicacion_id, persona_id) => {
  const pub = await Publicacion.findById(publicacion_id).select('formato').lean();
  if (!pub || pub.formato !== 'anuncio') {
    const err = new Error('Solo se pueden marcar como vistos los anuncios');
    err.statusCode = 400;
    throw err;
  }
  await AnuncioVisto.updateOne(
    { persona_id, publicacion_id },
    { $setOnInsert: { persona_id, publicacion_id } },
    { upsert: true },
  );
  return true;
};

// ── Aulas disponibles para el autor ──────────────────────────────────────────

exports.getMisAulas = async (personaId, autorRol) => {
  if (autorRol === 'Docente') {
    return await Aula.find({ id_profesor: personaId })
      .populate('id_curso', 'nombre_curso')
      .populate('id_ciclo', 'nombre_ciclo')
      .lean();
  }
  if (autorRol === 'Coordinador') {
    return await Aula.find({ id_coordinador: personaId })
      .populate('id_curso', 'nombre_curso')
      .populate('id_ciclo', 'nombre_ciclo')
      .lean();
  }
  if (autorRol === 'Estudiante') {
    const Ciclo = require('../models/ciclo');
    const ESTADOS_ACTIVOS = ['en curso', 'inscrito', 'aprobado', 'pendiente'];
    const cicloActual = await Ciclo.findOne({ actual: true }).select('_id').lean();
    const rels = await AulaAlumno.find({ id_alumno: personaId, estado: { $in: ESTADOS_ACTIVOS } }).select('id_aula').lean();
    const aulaIds = rels.map(r => r.id_aula);
    if (!aulaIds.length) return [];
    const aulaFilter = { _id: { $in: aulaIds } };
    if (cicloActual) aulaFilter.id_ciclo = cicloActual._id;
    return await Aula.find(aulaFilter)
      .populate('id_curso', 'nombre_curso')
      .populate('id_ciclo', 'nombre_ciclo')
      .lean();
  }
  return [];
};
