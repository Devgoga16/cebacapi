const mongoose = require('mongoose');
const MensajeAula = require('../models/mensajeAula');
const Aula        = mongoose.models.Aula        || require('../models/aula');
const AulaAlumno  = mongoose.models.AulaAlumno  || require('../models/aulaAlumno');

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

  if (esDocente) return { rol: 'Docente', aula };
  if (esCoord) return { rol: 'Coordinador', aula };

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

  return mensaje;
};

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
