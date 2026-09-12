const mongoose = require('mongoose');
const MensajeAula = require('../models/mensajeAula');
const Aula        = mongoose.models.Aula        || require('../models/aula');
const AulaAlumno  = mongoose.models.AulaAlumno  || require('../models/aulaAlumno');
const Curso       = mongoose.models.Curso       || require('../models/curso');
const firebase    = require('./firebaseService');

// Verifica que una persona pertenece al aula (como alumno, docente o coordinador)
async function verificarAcceso(aulaId, personaId) {
  const aula = await Aula.findById(aulaId).lean();
  if (!aula) return null;

  // Alumno primero: si está inscrito como estudiante, ese rol tiene prioridad
  const inscrito = await AulaAlumno.findOne({
    id_aula: aulaId,
    id_alumno: personaId,
    estado: { $in: ['inscrito', 'en curso', 'aprobado'] },
  }).lean();

  if (inscrito) return { rol: 'Estudiante', aula };

  const esDocente = String(aula.id_profesor) === String(personaId);
  const esCoord = aula.id_coordinador && String(aula.id_coordinador) === String(personaId);
  const esCotutor = aula.id_cotutor && String(aula.id_cotutor) === String(personaId);

  if (esDocente) return { rol: 'Docente', aula };
  if (esCoord) return { rol: 'Coordinador', aula };
  if (esCotutor) return { rol: 'Co-tutor', aula };

  return null;
}

exports.getMensajes = async (aulaId, { page = 1, limit = 40 } = {}) => {
  const skip = (page - 1) * limit;
  const mensajes = await MensajeAula.find({ aula_id: aulaId, eliminado: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await MensajeAula.countDocuments({ aula_id: aulaId, eliminado: false });

  // Devolver en orden cronológico (más antiguo primero)
  return {
    mensajes: mensajes.reverse(),
    meta: { total, page, pages: Math.ceil(total / limit) },
  };
};

exports.enviarMensaje = async (aulaId, personaId, nombrePersona, contenido) => {
  const acceso = await verificarAcceso(aulaId, personaId);
  if (!acceso) {
    const err = new Error('No tienes acceso a este aula');
    err.status = 403;
    throw err;
  }

  const mensaje = await MensajeAula.create({
    aula_id: aulaId,
    autor_id: personaId,
    autor_nombre: nombrePersona,
    autor_rol: acceso.rol,
    contenido: contenido.trim(),
  });

  // Push notification a los demás miembros del aula
  notificarChatAula(aulaId, personaId, nombrePersona, contenido.trim()).catch(() => {});

  return mensaje;
};

async function notificarChatAula(aulaId, autorId, autorNombre, contenido) {
  try {
    const aula = await Aula.findById(aulaId).select('id_profesor id_coordinador id_cotutor id_curso').lean();
    if (!aula) return;

    // Obtener nombre del curso
    let courseName = 'el aula';
    if (aula.id_curso) {
      const curso = await Curso.findById(aula.id_curso).select('nombre_curso').lean();
      if (curso) courseName = curso.nombre_curso;
    }

    // Recopilar todos los miembros del aula
    const miembros = new Set();
    if (aula.id_profesor) miembros.add(String(aula.id_profesor));
    if (aula.id_coordinador) miembros.add(String(aula.id_coordinador));
    if (aula.id_cotutor) miembros.add(String(aula.id_cotutor));

    const alumnos = await AulaAlumno.find({
      id_aula: aulaId,
      estado: { $in: ['inscrito', 'en curso', 'aprobado'] },
    }).select('id_alumno').lean();
    alumnos.forEach(a => miembros.add(String(a.id_alumno)));

    // Excluir al autor
    miembros.delete(String(autorId));

    if (miembros.size === 0) return;

    const preview = contenido.length > 80 ? contenido.substring(0, 80) + '...' : contenido;
    firebase.enviarPushAMuchos([...miembros], {
      titulo: `${autorNombre} en ${courseName}`,
      cuerpo: preview,
      data: { tipo: 'chat_aula', aula_id: String(aulaId) },
    });
  } catch (err) {
    console.error('[chat-push] Error:', err.message);
  }
}

exports.eliminarMensaje = async (mensajeId, personaId) => {
  const mensaje = await MensajeAula.findById(mensajeId);
  if (!mensaje) {
    const err = new Error('Mensaje no encontrado');
    err.status = 404;
    throw err;
  }
  if (String(mensaje.autor_id) !== String(personaId)) {
    const err = new Error('Solo puedes eliminar tus propios mensajes');
    err.status = 403;
    throw err;
  }
  mensaje.eliminado = true;
  await mensaje.save();
};

exports.verificarAcceso = verificarAcceso;
