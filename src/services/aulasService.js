const Aula = require('../models/aula');
const AulaAlumno = require('../models/aulaalumno');
const Inscripcion = require('../models/inscripcion');

exports.getAllAulas = async () => {
  return await Aula.find().populate('id_profesor id_curso id_ciclo').populate({
      path: 'id_curso',
      populate: {
        path: 'id_nivel'
      }
    });
};

exports.getAulaById = async (id) => {
  return await Aula.findById(id).populate('id_profesor id_curso id_ciclo');
};

exports.createAula = async (data) => {
  const aula = new Aula(data);
  return await aula.save();
};

exports.updateAula = async (id, data) => {
  return await Aula.findByIdAndUpdate(id, data, { new: true }).populate('id_profesor id_curso id_ciclo');
};

exports.deleteAula = async (id) => {
  const result = await Aula.findByIdAndDelete(id);
  return !!result;
};

// Lista aulas filtrando por id_curso e id_ciclo
exports.getAulasByCursoAndCiclo = async (id_curso, id_ciclo) => {
  const filter = {};
  if (id_curso) filter.id_curso = id_curso;
  if (id_ciclo) filter.id_ciclo = id_ciclo;

  return await Aula.find(filter)
    .populate('id_profesor id_curso id_ciclo')
    .populate({
      path: 'id_curso',
      populate: { path: 'id_nivel' }
    })
    .lean();
};

// Devuelve dos listas para un aula: alumnos asignados (AulaAlumnos) e inscripciones
exports.getListasPorAula = async (idAula) => {
  const [aulaAlumnos, inscripciones] = await Promise.all([
    AulaAlumno.find({ id_aula: idAula })
      .populate({
        path: 'id_alumno',
        populate: [
          { path: 'id_user', select: 'active validado' },
          { path: 'id_ministerio', populate: { path: 'id_iglesia' } }
        ]
      }),
    Inscripcion.find({ id_aula: idAula })
      .populate({
        path: 'id_alumno',
        populate: [
          { path: 'id_user', select: 'active validado' },
          { path: 'id_ministerio', populate: { path: 'id_iglesia' } }
        ]
      })
  ]);

  // Agrupar para tabs del front según estado del registro en AulaAlumno
  const estadosActivos = new Set(['aprobado', 'reprobado', 'en curso']);
  const estudiantesActivos = aulaAlumnos.filter(a => estadosActivos.has(String(a?.estado || '').toLowerCase()));
  const estudiantesInactivos = aulaAlumnos.filter(a => String(a?.estado || '').toLowerCase() === 'retirado');

  const solicitudesPendientes = inscripciones.filter(i => i.estado === 'Pendiente');
  const solicitudesRechazadas = inscripciones.filter(i => i.estado === 'Rechazado');

  return {
    estudiantes: {
      activos: estudiantesActivos,
      inactivos: estudiantesInactivos,
      total_activos: estudiantesActivos.length,
      total_inactivos: estudiantesInactivos.length,
    },
    solicitudes: {
      pendientes: solicitudesPendientes,
      rechazadas: solicitudesRechazadas,
      total_pendientes: solicitudesPendientes.length,
      total_rechazadas: solicitudesRechazadas.length,
    }
  };
};
