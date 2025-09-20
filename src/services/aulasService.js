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

// Lista todas las aulas donde una persona es profesor, agrupadas por ciclo
// Devuelve un arreglo de grupos: [{ ciclo, aulas: [] }],
// ordenado por prioridad: inscripcionesabiertas (true) primero, luego actual (true),
// y finalmente por fecha_inicio del ciclo descendente. Los registros sin ciclo van al final.
exports.getAulasPorProfesorAgrupadasPorCiclo = async (id_persona) => {
  if (!id_persona) {
    const err = new Error('id_persona es requerido');
    err.statusCode = 400;
    throw err;
  }

  const aulas = await Aula.find({ id_profesor: id_persona })
    .populate({
      path: 'id_curso',
      populate: { path: 'id_nivel' }
    })
    .populate('id_ciclo')
    .lean();

  // Agrupar por ciclo
  const grupos = new Map();
  for (const aula of aulas) {
    const cicloDoc = aula?.id_ciclo || null;
    const key = cicloDoc ? String(cicloDoc._id || cicloDoc) : 'sin_ciclo';
    if (!grupos.has(key)) grupos.set(key, { ciclo: cicloDoc, aulas: [] });
    grupos.get(key).aulas.push(aula);
  }

  // Ordenar grupos por prioridad
  const ordenados = Array.from(grupos.values()).sort((a, b) => {
    if (!a.ciclo && !b.ciclo) return 0;
    if (!a.ciclo) return 1;
    if (!b.ciclo) return -1;
    const rank = (c) => (c.inscripcionesabiertas ? 2 : (c.actual ? 1 : 0));
    const ra = rank(a.ciclo);
    const rb = rank(b.ciclo);
    if (ra !== rb) return rb - ra; // mayor prioridad primero
    const ad = a.ciclo.fecha_inicio ? new Date(a.ciclo.fecha_inicio).getTime() : 0;
    const bd = b.ciclo.fecha_inicio ? new Date(b.ciclo.fecha_inicio).getTime() : 0;
    return bd - ad; // más reciente primero
  });

  return ordenados;
};
