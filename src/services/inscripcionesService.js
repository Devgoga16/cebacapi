const Inscripcion = require('../models/inscripcion');
const AulaAlumno = require('../models/aulaalumno');
const Ciclo = require('../models/ciclo');
const Aula = require('../models/aula');

exports.getAllInscripciones = async () => {
  return await Inscripcion.find().populate('id_aula id_alumno');
};

exports.getInscripcionById = async (id) => {
  return await Inscripcion.findById(id).populate('id_aula id_alumno');
};

exports.createInscripcion = async (data) => {
  const inscripcion = new Inscripcion(data);
  return await inscripcion.save();
};

exports.updateInscripcion = async (id, data) => {
  return await Inscripcion.findByIdAndUpdate(id, data, { new: true }).populate('id_aula id_alumno');
};

exports.deleteInscripcion = async (id) => {
  const result = await Inscripcion.findByIdAndDelete(id);
  return !!result;
};

// Aprueba una inscripción: crea el registro en AulaAlumno (estado 'en curso') y marca la inscripción como 'Aceptado'
exports.aprobarInscripcion = async (idInscripcion) => {
  const insc = await Inscripcion.findById(idInscripcion);
  if (!insc) {
    const err = new Error('Inscripción no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const { id_aula, id_alumno } = insc;
  if (!id_aula || !id_alumno) {
    const err = new Error('Inscripción inválida: falta id_aula o id_alumno');
    err.statusCode = 400;
    throw err;
  }

  // Evitar duplicados: si ya existe un AulaAlumno con misma aula y alumno, no crear otro
  const existing = await AulaAlumno.findOne({ id_aula, id_alumno });
  if (!existing) {
    const nuevo = new AulaAlumno({ id_aula, id_alumno, estado: 'en curso' });
    await nuevo.save();
  }

  const updated = await Inscripcion.findByIdAndUpdate(
    idInscripcion,
    { estado: 'Aceptado' },
    { new: true }
  ).populate('id_aula id_alumno');

  return { message: 'Inscripción aprobada', inscripcion: updated };
};

// Rechaza una inscripción: actualiza estado a 'Rechazado' y guarda observación si se envía
exports.rechazarInscripcion = async (idInscripcion, observacion = '') => {
  const insc = await Inscripcion.findById(idInscripcion);
  if (!insc) {
    const err = new Error('Inscripción no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const updated = await Inscripcion.findByIdAndUpdate(
    idInscripcion,
    { estado: 'Rechazado', ...(observacion ? { observacion } : {}) },
    { new: true }
  ).populate('id_aula id_alumno');

  return { message: 'Inscripción rechazada', inscripcion: updated };
};

// Lista aulas disponibles para inscripción en el ciclo actual
// Devuelve { cicloActual, aulas }
exports.getAulasDisponiblesParaInscripcion = async () => {
  const cicloActual = await Ciclo.findOne({ actual: true });
  let aulas = [];
  if (cicloActual) {
    aulas = await Aula.find({ id_ciclo: cicloActual._id })
      .populate({
        path: 'id_curso',
        populate: [
          { path: 'id_nivel' },
          // Populate dinámico de prerequisitos; si el ref es Curso, tendrá id_nivel; si es Nivel, no.
          // Desactivamos strictPopulate para evitar error cuando el esquema no tiene ese path.
          { path: 'prerequisitos.ref_id' },
          { path: 'prerequisitos.ref_id.id_nivel', strictPopulate: false },
        ]
      })
      .populate('id_ciclo');
  }
  return { cicloActual, aulas };
};
