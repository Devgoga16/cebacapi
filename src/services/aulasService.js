const Aula = require('../models/aula');
const AulaAlumno = require('../models/aulaalumno');
const Inscripcion = require('../models/inscripcion');
const Asistencia = require('../models/asistencia');
const Calificacion = require('../models/calificacion');
const AnuncioProfesor = require('../models/anuncioProfesor');
const TipoCalificacion = require('../models/tipoCalificacion');
const RequerimientoAula = require('../models/requerimientoAula');
const Curso = require('../models/curso');
const Ciclo = require('../models/ciclo');
const Persona = require('../models/persona');
const { crearGrupoWhatsApp, agregarParticipantesGrupo, sleep } = require('../utils/whatsappNotifier');
const mongoose = require('mongoose');

// Teléfono peruano: exactamente 9 dígitos, empieza con 9, sin espacios ni otros caracteres
const TELEFONO_VALIDO_REGEX = /^9\d{8}$/;

function normalizeToLocalDayUTC(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
  // Si dateInput es string en formato YYYY-MM-DD, parsearlo directamente en UTC
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [year, month, day] = dateInput.split('T')[0].split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  // Si es Date object, usar UTC del date object
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

exports.getAllAulas = async () => {
  return await Aula.aggregate([
    {
      $lookup: {
        from: 'personas',
        localField: 'id_profesor',
        foreignField: '_id',
        as: 'id_profesor',
        pipeline: [
          {
            $project: {
              nombres: 1,
              apellido_paterno: 1,
              apellido_materno: 1,
              email: 1,
              telefono: 1,
              numero_documento: 1,
              // Excluir imagen para performance
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'personas',
        localField: 'id_coordinador',
        foreignField: '_id',
        as: 'id_coordinador',
        pipeline: [
          {
            $project: {
              nombres: 1,
              apellido_paterno: 1,
              apellido_materno: 1,
              email: 1,
              telefono: 1,
              numero_documento: 1,
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: 'cursos',
        localField: 'id_curso',
        foreignField: '_id',
        as: 'id_curso_temp'
      }
    },
    {
      $lookup: {
        from: 'niveles',
        localField: 'id_curso_temp.id_nivel',
        foreignField: '_id',
        as: 'nivel_temp'
      }
    },
    {
      $lookup: {
        from: 'ciclos',
        localField: 'id_ciclo',
        foreignField: '_id',
        as: 'id_ciclo'
      }
    },
    {
      $addFields: {
        'id_profesor': { $arrayElemAt: ['$id_profesor', 0] },
        'id_coordinador': { $arrayElemAt: ['$id_coordinador', 0] },
        'id_curso': {
          $mergeObjects: [
            { $arrayElemAt: ['$id_curso_temp', 0] },
            { id_nivel: { $arrayElemAt: ['$nivel_temp', 0] } }
          ]
        },
        'id_ciclo': { $arrayElemAt: ['$id_ciclo', 0] }
      }
    },
    {
      $project: {
        id_curso_temp: 0,
        nivel_temp: 0
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);
};

exports.getAulaById = async (id) => {
  return await Aula.findById(id).populate('id_profesor id_coordinador id_curso id_ciclo');
};

exports.createAula = async (data) => {
  const aula = new Aula(data);
  await aula.save();
  return await aula.populate('id_profesor id_coordinador id_curso id_ciclo');
};

exports.updateAula = async (id, data) => {
  return await Aula.findByIdAndUpdate(id, data, { new: true }).populate('id_profesor id_coordinador id_curso id_ciclo');
};

exports.deleteAula = async (id) => {
  const result = await Aula.findByIdAndDelete(id);
  return !!result;
};

// Borrado físico completo del aula y todas sus relaciones
exports.deleteAulaCompleto = async (id) => {
  // Verificar que el aula existe
  const aula = await Aula.findById(id);
  if (!aula) {
    return { success: false, message: 'Aula no encontrada' };
  }

  const deletedInfo = {
    inscripciones: 0,
    aulaAlumnos: 0,
    asistencias: 0,
    calificaciones: 0,
    anunciosProfesor: 0,
    tiposCalificacion: 0,
    requerimientosAula: 0,
    aula: false
  };

  try {
    // Eliminar todas las relaciones de forma paralela
    const [inscripcionesRes, aulaAlumnosRes, asistenciasRes, calificacionesRes, anunciosRes, tiposCalifRes, requerimientosRes] = await Promise.all([
      Inscripcion.deleteMany({ id_aula: id }),
      AulaAlumno.deleteMany({ id_aula: id }),
      Asistencia.deleteMany({ id_aula: id }),
      Calificacion.deleteMany({ id_aula: id }),
      AnuncioProfesor.deleteMany({ id_aula: id }),
      TipoCalificacion.deleteMany({ id_aula: id }),
      RequerimientoAula.deleteMany({ id_aula: id })
    ]);

    deletedInfo.inscripciones = inscripcionesRes.deletedCount || 0;
    deletedInfo.aulaAlumnos = aulaAlumnosRes.deletedCount || 0;
    deletedInfo.asistencias = asistenciasRes.deletedCount || 0;
    deletedInfo.calificaciones = calificacionesRes.deletedCount || 0;
    deletedInfo.anunciosProfesor = anunciosRes.deletedCount || 0;
    deletedInfo.tiposCalificacion = tiposCalifRes.deletedCount || 0;
    deletedInfo.requerimientosAula = requerimientosRes.deletedCount || 0;

    // Finalmente, eliminar el aula
    const aulaDeleted = await Aula.findByIdAndDelete(id);
    deletedInfo.aula = !!aulaDeleted;

    return {
      success: true,
      message: 'Aula y todas sus relaciones eliminadas correctamente',
      deletedInfo
    };
  } catch (error) {
    throw new Error(`Error al eliminar aula y sus relaciones: ${error.message}`);
  }
};

// Lista aulas filtrando por id_curso e id_ciclo
exports.getAulasByCursoAndCiclo = async (id_curso, id_ciclo) => {
  const filter = {};
  if (id_curso) filter.id_curso = id_curso;
  if (id_ciclo) filter.id_ciclo = id_ciclo;

  const aulas = await Aula.find(filter)
    .populate('id_profesor id_coordinador id_curso id_ciclo')
    .populate({
      path: 'id_curso',
      populate: { path: 'id_nivel' }
    })
    .lean();

  if (aulas.length === 0) return aulas;

  // Para cada aula, indicar si ya se registró al menos una calificación
  const idsAulas = aulas.map((a) => a._id);
  const aulasConNotas = await Calificacion.distinct('id_aula', { id_aula: { $in: idsAulas } });
  const setConNotas = new Set(aulasConNotas.map((id) => String(id)));

  // Para cada aula, indicar si ya se tomó asistencia y cuándo fue la última vez
  const mapaUltimaAsistencia = await getUltimaAsistenciaPorAula(idsAulas);

  return aulas.map((a) => ({
    ...a,
    tiene_calificaciones: setConNotas.has(String(a._id)),
    tiene_asistencias: mapaUltimaAsistencia.has(String(a._id)),
    ultima_asistencia: mapaUltimaAsistencia.get(String(a._id)) || null,
  }));
};

function normalizarFechaUTC(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [year, month, day] = dateInput.split('T')[0].split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Calendario semanal de aulas del ciclo actual: para cada día de la semana que
 * contiene `fechaRef` (domingo a sábado), lista las aulas que dictan clase ese
 * día con su horario, e indica si ya se registró asistencia en esa fecha puntual.
 */
exports.getCalendarioSemana = async (fechaRef) => {
  const ref = normalizarFechaUTC(fechaRef);
  const diaSemanaRef = ref.getUTCDay();
  const inicioSemana = new Date(ref);
  inicioSemana.setUTCDate(ref.getUTCDate() - diaSemanaRef);

  const fechasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicioSemana);
    d.setUTCDate(inicioSemana.getUTCDate() + i);
    return d;
  });

  const cicloActual = await Ciclo.findOne({ actual: true }).lean();
  if (!cicloActual) {
    return {
      ciclo: null,
      semana: { desde: fechasSemana[0], hasta: fechasSemana[6] },
      dias: fechasSemana.map((fecha, i) => ({ fecha, dia: DIAS_SEMANA_POR_INDICE_UTC[i], aulas: [] })),
    };
  }

  const aulas = await Aula.find({ id_ciclo: cicloActual._id })
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .populate('id_coordinador', 'nombres apellido_paterno apellido_materno')
    .populate('id_curso', 'nombre_curso')
    .lean();

  const idsAulas = aulas.map((a) => a._id);
  const asistenciasSemana = idsAulas.length
    ? await Asistencia.aggregate([
        { $match: { id_aula: { $in: idsAulas }, fecha: { $gte: fechasSemana[0], $lte: fechasSemana[6] } } },
        {
          $group: {
            _id: { id_aula: '$id_aula', fecha: '$fecha' },
            total: { $sum: 1 },
            presente: { $sum: { $cond: [{ $eq: ['$estado', 'presente'] }, 1, 0] } },
            ausente: { $sum: { $cond: [{ $eq: ['$estado', 'ausente'] }, 1, 0] } },
            tarde: { $sum: { $cond: [{ $eq: ['$estado', 'tarde'] }, 1, 0] } },
            justificado: { $sum: { $cond: [{ $eq: ['$estado', 'justificado'] }, 1, 0] } },
          },
        },
      ])
    : [];

  const mapaAsistencia = new Map();
  asistenciasSemana.forEach((r) => {
    const key = `${r._id.id_aula}_${new Date(r._id.fecha).toISOString()}`;
    mapaAsistencia.set(key, {
      total_registros: r.total,
      totales_por_estado: { presente: r.presente, ausente: r.ausente, tarde: r.tarde, justificado: r.justificado },
    });
  });

  const dias = fechasSemana.map((fecha, i) => {
    const nombreDia = DIAS_SEMANA_POR_INDICE_UTC[i];
    const aulasDia = aulas
      .filter((a) => a.dia === nombreDia)
      .map((a) => {
        const key = `${a._id}_${fecha.toISOString()}`;
        const asistInfo = mapaAsistencia.get(key) || null;
        return {
          id_aula: a._id,
          curso: a.id_curso?.nombre_curso || null,
          profesor: a.id_profesor
            ? `${a.id_profesor.nombres || ''} ${a.id_profesor.apellido_paterno || ''}`.trim()
            : null,
          coordinador: a.id_coordinador
            ? `${a.id_coordinador.nombres || ''} ${a.id_coordinador.apellido_paterno || ''}`.trim()
            : null,
          hora_inicio: a.hora_inicio,
          hora_fin: a.hora_fin,
          numeroAula: a.numeroAula || null,
          es_presencial: a.es_presencial,
          asistencia_tomada: !!asistInfo,
          totales_asistencia: asistInfo?.totales_por_estado || null,
        };
      })
      .sort((x, y) => (x.hora_inicio || '').localeCompare(y.hora_inicio || ''));

    return { fecha, dia: nombreDia, aulas: aulasDia };
  });

  return {
    ciclo: { _id: cicloActual._id, nombre_ciclo: cicloActual.nombre_ciclo },
    semana: { desde: fechasSemana[0], hasta: fechasSemana[6] },
    dias,
  };
};

// Para un conjunto de aulas, devuelve un mapa id_aula -> { fecha, dia } de la última
// fecha en que se registró asistencia (cualquier alumno) en esa aula.
const DIAS_SEMANA_POR_INDICE_UTC = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
async function getUltimaAsistenciaPorAula(idsAulas) {
  if (!idsAulas.length) return new Map();
  const idsObjeto = idsAulas.map((id) => new mongoose.Types.ObjectId(String(id)));
  const agg = await Asistencia.aggregate([
    { $match: { id_aula: { $in: idsObjeto } } },
    { $group: { _id: '$id_aula', ultima_fecha: { $max: '$fecha' } } },
  ]);
  const mapa = new Map();
  for (const row of agg) {
    const fecha = row.ultima_fecha;
    mapa.set(String(row._id), {
      fecha,
      dia: DIAS_SEMANA_POR_INDICE_UTC[new Date(fecha).getUTCDay()],
    });
  }
  return mapa;
}

// Lista todas las aulas donde la persona es coordinador
exports.getAulasPorCoordinador = async (id_persona) => {
  if (!id_persona) {
    const err = new Error('id_persona es requerido');
    err.statusCode = 400;
    throw err;
  }

  const aulas = await Aula.find({ id_coordinador: id_persona })
    .populate('id_profesor')
    .populate({
      path: 'id_curso',
      populate: { path: 'id_nivel' }
    })
    .populate('id_ciclo')
    .sort({ createdAt: -1 })
    .lean();

  const ultimasPorAula = await getUltimaAsistenciaPorAula(aulas.map((a) => a._id));
  return aulas.map((a) => ({
    ...a,
    ultima_asistencia: ultimasPorAula.get(String(a._id)) || null,
  }));
};

// Devuelve los docentes (sin duplicados) de las aulas asignadas a un coordinador,
// incluyendo su última conexión (Usuario.last_login) y el detalle de cada aula
// donde dicho docente está a cargo bajo ese coordinador.
exports.getDocentesPorCoordinador = async (id_persona) => {
  if (!id_persona) {
    const err = new Error('id_persona es requerido');
    err.statusCode = 400;
    throw err;
  }

  const aulas = await Aula.find({ id_coordinador: id_persona })
    .populate({
      path: 'id_profesor',
      populate: { path: 'id_user', select: 'username last_login active' },
    })
    .populate({
      path: 'id_curso',
      populate: { path: 'id_nivel' }
    })
    .populate('id_ciclo')
    .sort({ createdAt: -1 })
    .lean();

  const docentesMap = new Map();
  for (const aula of aulas) {
    const profesor = aula.id_profesor;
    if (!profesor || !profesor._id) continue;
    const key = String(profesor._id);
    if (!docentesMap.has(key)) {
      docentesMap.set(key, {
        docente: profesor,
        last_login: profesor.id_user?.last_login || null,
        aulas: [],
      });
    }
    docentesMap.get(key).aulas.push({
      _id: aula._id,
      id_curso: aula.id_curso,
      id_ciclo: aula.id_ciclo,
      dia: aula.dia,
      hora_inicio: aula.hora_inicio,
      hora_fin: aula.hora_fin,
      estado: aula.estado,
      numeroAula: aula.numeroAula,
    });
  }

  return Array.from(docentesMap.values());
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
  const estadosActivos = new Set(['aprobado', 'reprobado', 'en curso', 'inscrito']);
  const estudiantesActivos = aulaAlumnos.filter(a => estadosActivos.has(String(a?.estado || '').toLowerCase()));
  const estudiantesInactivos = aulaAlumnos.filter(a => String(a?.estado || '').toLowerCase() === 'retirado');

  const solicitudesPendientes = aulaAlumnos.filter(a => String(a?.estado || '').toLowerCase() === 'pendiente');
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

// Cambia el estado de un aula a 'iniciada' validando que la fecha actual esté dentro del rango [fecha_inicio, fecha_fin]
exports.iniciarAula = async (idAula) => {
  const aula = await Aula.findById(idAula).populate('id_ciclo');
  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Nota: Se omite validación por rango de fechas del aula; solo se valida ciclo actual

  // Validar que el ciclo asociado esté activo (actual === true)
  const ciclo = aula.id_ciclo;
  if (!ciclo || ciclo.actual !== true) {
    const err = new Error('El ciclo aún no está activo para iniciar el aula');
    err.statusCode = 400;
    throw err;
  }

  // Si ya está terminada, no permitir reiniciar
  if (aula.estado === 'terminada') {
    const err = new Error('El aula ya está terminada');
    err.statusCode = 400;
    throw err;
  }

  // Si ya está iniciada, es idempotente
  if (aula.estado === 'iniciada') return aula;

  aula.estado = 'iniciada';
  await aula.save();

  // Al iniciar el aula, actualizar los registros de AulaAlumno asociados a 'en curso'
  await AulaAlumno.updateMany(
    { id_aula: idAula },
    { $set: { estado: 'en curso' } }
  );
  return aula;
};

// Resumen para docente: header de aula, alumnos del salón con estado en el aula,
// asistencia del día (si existe) y totales acumulados por alumno en el aula.
exports.getDocenteResumenAula = async (idAula, fecha) => {
  const [aula, aulaAlumnos] = await Promise.all([
    Aula.findById(idAula)
      .populate([
        { path: 'id_curso', populate: { path: 'id_nivel' } },
        { path: 'id_ciclo' },
        { path: 'id_profesor', select: '-imagen' },
      ])
      .lean(),
    AulaAlumno.find({ id_aula: idAula })
      .populate({
        path: 'id_alumno',
        select: 'nombres apellido_paterno apellido_materno numero_documento telefono fecha_nacimiento',
      })
      .lean(),
  ]);

  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const fechaClave = normalizeToLocalDayUTC(fecha);

  // IDs de alumnos del aula
  const alumnoIds = aulaAlumnos
    .map((aa) => aa.id_alumno?._id || aa.id_alumno)
    .filter(Boolean)
    .map((x) => String(x));

  // Asistencia del día para esos alumnos
  let asistenciasHoy = [];
  if (alumnoIds.length > 0) {
    asistenciasHoy = await Asistencia.find({
      id_aula: idAula,
      id_alumno: { $in: alumnoIds },
      fecha: fechaClave,
    })
      .select('id_alumno estado observacion')
      .lean();
  }
  const mapAsisHoy = new Map(asistenciasHoy.map((a) => [String(a.id_alumno), a]));

  // Totales acumulados por alumno en este aula
  let totalesPorAlumno = new Map();
  if (alumnoIds.length > 0) {
    const agg = await Asistencia.aggregate([
      {
        $match: {
          id_aula: new mongoose.Types.ObjectId(String(idAula)),
          id_alumno: { $in: alumnoIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      {
        $group: {
          _id: { id_alumno: '$id_alumno', estado: '$estado' },
          count: { $sum: 1 },
        },
      },
    ]);
    // Construir mapa: id_alumno -> { presente, ausente, tarde, justificado }
    totalesPorAlumno = new Map();
    for (const row of agg) {
      const id = String(row._id.id_alumno);
      const estado = row._id.estado;
      if (!totalesPorAlumno.has(id)) {
        totalesPorAlumno.set(id, { presente: 0, ausente: 0, tarde: 0, justificado: 0 });
      }
      const obj = totalesPorAlumno.get(id);
      if (estado in obj) obj[estado] += row.count;
    }
  }

  // Totales del día por estado para el aula
  const resumenDia = { presente: 0, ausente: 0, tarde: 0, justificado: 0 };
  for (const a of asistenciasHoy) {
    if (a.estado in resumenDia) resumenDia[a.estado]++;
  }

  // Armar lista de alumnos final
  const alumnos = aulaAlumnos
    .map((aa) => {
      const id = String(aa.id_alumno?._id || aa.id_alumno);
      const hoy = mapAsisHoy.get(id);
      const tot = totalesPorAlumno.get(id) || { presente: 0, ausente: 0, tarde: 0, justificado: 0 };
      return {
        id_alumno: id,
        alumno: aa.id_alumno,
        estado_aula: aa.estado || null,
        asistencia_hoy: hoy ? { estado: hoy.estado, observacion: hoy.observacion || '' } : null,
        totales_asistencia: tot,
        tipo: 'alumno',
      };
    })
    .sort((a, b) => {
      const ap = (a.alumno?.apellido_paterno || '').toLowerCase();
      const bp = (b.alumno?.apellido_paterno || '').toLowerCase();
      if (ap !== bp) return ap.localeCompare(bp);
      const am = (a.alumno?.apellido_materno || '').toLowerCase();
      const bm = (b.alumno?.apellido_materno || '').toLowerCase();
      if (am !== bm) return am.localeCompare(bm);
      const an = (a.alumno?.nombres || '').toLowerCase();
      const bn = (b.alumno?.nombres || '').toLowerCase();
      if (an !== bn) return an.localeCompare(bn);
      const ad = (a.alumno?.numero_documento || '').toLowerCase();
      const bd = (b.alumno?.numero_documento || '').toLowerCase();
      return ad.localeCompare(bd);
    });

  return {
    aula,
    fecha: fechaClave,
    resumen_dia: {
      totales_por_estado: resumenDia,
      total_registros: asistenciasHoy.length,
    },
    alumnos,
  };
};

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

// Resumen para admin: progreso de asistencia de un aula en un rango de fechas
// Inputs: idAula, desde (YYYY-MM-DD opcional), hasta (YYYY-MM-DD opcional)
// Output:
// {
//   aula,
//   rango: { desde, hasta },
//   sesiones_tomadas: numero_de_fechas_con_registros,
//   resumen_general: { presente, ausente, tarde, justificado, total_registros },
//   alumnos: [
//     {
//       id_alumno, alumno, estado_aula,
//       totales: { presente, ausente, tarde, justificado, total_registros },
//       porcentaje_presente: number, // 0..100
//       porcentaje_efectivo: number  // (presente + tarde) / total * 100
//     }
//   ],
//   timeline: [ { fecha, por_estado: { presente, ausente, tarde, justificado }, total_registros } ]
// }
exports.getAdminResumenAsistenciaAula = async (idAula, { desde, hasta } = {}) => {
  const aula = await Aula.findById(idAula)
    .populate([
      { path: 'id_curso', populate: { path: 'id_nivel' } },
      { path: 'id_ciclo' },
      { path: 'id_profesor', select: '-imagen' },
    ])
    .lean();

  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Normalizar fechas; por defecto: desde = fecha_inicio del aula o hoy si no hay; hasta = min(hoy, fecha_fin del aula si existe)
  const hoy = normalizeToLocalDayUTC();
  const defDesde = aula.fecha_inicio ? normalizeToLocalDayUTC(aula.fecha_inicio) : hoy;
  const defHastaRaw = aula.fecha_fin ? normalizeToLocalDayUTC(aula.fecha_fin) : hoy;
  const hastaFinal = defHastaRaw > hoy ? hoy : defHastaRaw;

  const desdeFecha = desde ? normalizeToLocalDayUTC(desde) : defDesde;
  const hastaFecha = hasta ? normalizeToLocalDayUTC(hasta) : hastaFinal;

  if (desdeFecha > hastaFecha) {
    const err = new Error('El rango de fechas es inválido: desde > hasta');
    err.statusCode = 400;
    throw err;
  }

  // Roster del aula
  const aulaAlumnos = await AulaAlumno.find({ id_aula: idAula })
    .populate({
      path: 'id_alumno',
      select: 'nombres apellido_paterno apellido_materno numero_documento',
    })
    .lean();
  const alumnoIds = aulaAlumnos
    .map((aa) => aa.id_alumno?._id || aa.id_alumno)
    .filter(Boolean)
    .map((x) => String(x));

  // Si no hay alumnos, devolver estructura básica
  if (alumnoIds.length === 0) {
    return {
      aula,
      rango: { desde: desdeFecha, hasta: hastaFecha },
      sesiones_tomadas: 0,
      resumen_general: { presente: 0, ausente: 0, tarde: 0, justificado: 0, total_registros: 0 },
      alumnos: [],
      timeline: [],
    };
  }

  const idAulaObj = new mongoose.Types.ObjectId(String(idAula));
  const alumnoObjIds = alumnoIds.map((id) => new mongoose.Types.ObjectId(id));

  const [agg] = await Asistencia.aggregate([
    {
      $match: {
        id_aula: idAulaObj,
        id_alumno: { $in: alumnoObjIds },
        fecha: { $gte: desdeFecha, $lte: hastaFecha },
      },
    },
    {
      $facet: {
        porAlumno: [
          {
            $group: {
              _id: { id_alumno: '$id_alumno', estado: '$estado' },
              count: { $sum: 1 },
            },
          },
        ],
        porDia: [
          {
            $group: {
              _id: { fecha: '$fecha', estado: '$estado' },
              count: { $sum: 1 },
            },
          },
        ],
        fechasTomadas: [
          { $group: { _id: '$fecha' } },
          { $sort: { _id: 1 } },
        ],
        general: [
          { $group: { _id: '$estado', count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  // Construir mapa por alumno
  const totalesPorAlumno = new Map();
  for (const row of agg.porAlumno || []) {
    const id = String(row._id.id_alumno);
    const estado = row._id.estado;
    if (!totalesPorAlumno.has(id)) {
      totalesPorAlumno.set(id, { presente: 0, ausente: 0, tarde: 0, justificado: 0, total_registros: 0 });
    }
    const obj = totalesPorAlumno.get(id);
    if (estado in obj) obj[estado] += row.count;
    obj.total_registros += row.count;
  }

  // Resumen general
  const resumenGeneral = { presente: 0, ausente: 0, tarde: 0, justificado: 0, total_registros: 0 };
  for (const row of agg.general || []) {
    const estado = row._id;
    if (estado in resumenGeneral) resumenGeneral[estado] += row.count;
    resumenGeneral.total_registros += row.count;
  }

  // Timeline por fecha
  const timelineMap = new Map();
  for (const row of agg.porDia || []) {
    const fechaKey = new Date(row._id.fecha).toISOString();
    if (!timelineMap.has(fechaKey)) {
      timelineMap.set(fechaKey, { fecha: row._id.fecha, por_estado: { presente: 0, ausente: 0, tarde: 0, justificado: 0 }, total_registros: 0 });
    }
    const t = timelineMap.get(fechaKey);
    const estado = row._id.estado;
    if (estado in t.por_estado) t.por_estado[estado] += row.count;
    t.total_registros += row.count;
  }
  const timeline = Array.from(timelineMap.values()).sort((a, b) => a.fecha - b.fecha);

  // Alumnos con porcentajes
  const alumnos = aulaAlumnos
    .map((aa) => {
      const id = String(aa.id_alumno?._id || aa.id_alumno);
      const tot = totalesPorAlumno.get(id) || { presente: 0, ausente: 0, tarde: 0, justificado: 0, total_registros: 0 };
      const total = tot.total_registros || 0;
      const porcentaje_presente = total > 0 ? (tot.presente * 100) / total : 0;
      const efectivo = tot.presente + tot.tarde; // considerar tarde como asistencia efectiva
      const porcentaje_efectivo = total > 0 ? (efectivo * 100) / total : 0;
      return {
        id_alumno: id,
        alumno: aa.id_alumno,
        estado_aula: aa.estado || null,
        totales: tot,
        porcentaje_presente: Number(porcentaje_presente.toFixed(2)),
        porcentaje_efectivo: Number(porcentaje_efectivo.toFixed(2)),
      };
    })
    .sort((a, b) => {
      const ap = (a.alumno?.apellido_paterno || '').toLowerCase();
      const bp = (b.alumno?.apellido_paterno || '').toLowerCase();
      if (ap !== bp) return ap.localeCompare(bp);
      const am = (a.alumno?.apellido_materno || '').toLowerCase();
      const bm = (b.alumno?.apellido_materno || '').toLowerCase();
      if (am !== bm) return am.localeCompare(bm);
      const an = (a.alumno?.nombres || '').toLowerCase();
      const bn = (b.alumno?.nombres || '').toLowerCase();
      if (an !== bn) return an.localeCompare(bn);
      const ad = (a.alumno?.numero_documento || '').toLowerCase();
      const bd = (b.alumno?.numero_documento || '').toLowerCase();
      return ad.localeCompare(bd);
    });

  const sesionesTomadas = (agg.fechasTomadas || []).length;

  return {
    aula,
    rango: { desde: desdeFecha, hasta: hastaFecha },
    sesiones_tomadas: sesionesTomadas,
    resumen_general: resumenGeneral,
    alumnos,
    timeline,
  };
};

// Datos para reporte Excel de asistencia por aula (rango de fechas)
// Output:
// {
//   aula,
//   rango: { desde, hasta },
//   fechas: [Date],
//   sesiones_tomadas,
//   alumnos: [ { id_alumno, alumno, estado_aula } ],
//   asistencias: [ { id_alumno, alumno, fecha, estado, observacion, tomado_por } ],
//   resumen_general: { presente, ausente, tarde, justificado, total_registros },
//   resumen_por_alumno: [ { id_alumno, alumno, totales } ]
// }
exports.getReporteExcelAula = async (idAula, { desde, hasta } = {}) => {
  if (!idAula) {
    const err = new Error('idAula es requerido');
    err.statusCode = 400;
    throw err;
  }

  const aula = await Aula.findById(idAula)
    .populate([
      { path: 'id_curso', populate: { path: 'id_nivel' } },
      { path: 'id_ciclo' },
      { path: 'id_profesor', select: '-imagen' },
    ])
    .lean();

  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const hoy = normalizeToLocalDayUTC();
  const defDesde = aula.fecha_inicio ? normalizeToLocalDayUTC(aula.fecha_inicio) : hoy;
  const defHastaRaw = aula.fecha_fin ? normalizeToLocalDayUTC(aula.fecha_fin) : hoy;
  const hastaFinal = defHastaRaw > hoy ? hoy : defHastaRaw;

  const desdeFecha = desde ? normalizeToLocalDayUTC(desde) : defDesde;
  const hastaFecha = hasta ? normalizeToLocalDayUTC(hasta) : hastaFinal;

  if (desdeFecha > hastaFecha) {
    const err = new Error('El rango de fechas es inválido: desde > hasta');
    err.statusCode = 400;
    throw err;
  }

  const aulaAlumnos = await AulaAlumno.find({ id_aula: idAula })
    .populate({
      path: 'id_alumno',
      select: 'nombres apellido_paterno apellido_materno numero_documento',
    })
    .lean();

  const alumnoIds = aulaAlumnos
    .map((aa) => aa.id_alumno?._id || aa.id_alumno)
    .filter(Boolean)
    .map((x) => String(x));

  if (alumnoIds.length === 0) {
    return {
      aula,
      rango: { desde: desdeFecha, hasta: hastaFecha },
      fechas: [],
      sesiones_tomadas: 0,
      alumnos: [],
      asistencias: [],
      resumen_general: { presente: 0, ausente: 0, tarde: 0, justificado: 0, total_registros: 0 },
      resumen_por_alumno: [],
    };
  }

  // Convertir IDs a ObjectIds para la query
  const alumnoObjIds = alumnoIds.map((id) => new mongoose.Types.ObjectId(id));

  const asistencias = await Asistencia.find({
    id_aula: new mongoose.Types.ObjectId(String(idAula)),
    id_alumno: { $in: alumnoObjIds },
    fecha: { $gte: desdeFecha, $lte: hastaFecha },
  })
    .populate({ path: 'id_alumno', select: 'nombres apellido_paterno apellido_materno numero_documento' })
    .populate({ path: 'tomado_por', select: 'nombres apellido_paterno apellido_materno numero_documento' })
    .lean();

  const fechasSet = new Set();
  const resumenGeneral = { presente: 0, ausente: 0, tarde: 0, justificado: 0, total_registros: 0 };
  const resumenPorAlumnoMap = new Map();

  for (const aa of aulaAlumnos) {
    const id = String(aa.id_alumno?._id || aa.id_alumno);
    resumenPorAlumnoMap.set(id, { presente: 0, ausente: 0, tarde: 0, justificado: 0, total_registros: 0 });
  }

  const asistenciasFlat = asistencias.map((a) => {
    const fechaKey = new Date(a.fecha).toISOString();
    fechasSet.add(fechaKey);
    if (a.estado in resumenGeneral) resumenGeneral[a.estado] += 1;
    resumenGeneral.total_registros += 1;

    const idAlumno = String(a.id_alumno?._id || a.id_alumno);
    const tot = resumenPorAlumnoMap.get(idAlumno);
    if (tot && a.estado in tot) {
      tot[a.estado] += 1;
      tot.total_registros += 1;
    }

    return {
      id_alumno: idAlumno,
      alumno: a.id_alumno || null,
      fecha: a.fecha,
      estado: a.estado,
      observacion: a.observacion || '',
      tomado_por: a.tomado_por || null,
    };
  });

  const fechas = Array.from(fechasSet)
    .map((f) => new Date(f))
    .sort((a, b) => a - b);

  const alumnos = aulaAlumnos
    .map((aa) => ({
      id_alumno: String(aa.id_alumno?._id || aa.id_alumno),
      alumno: aa.id_alumno || null,
      estado_aula: aa.estado || null,
    }))
    .sort((a, b) => {
      const ap = (a.alumno?.apellido_paterno || '').toLowerCase();
      const bp = (b.alumno?.apellido_paterno || '').toLowerCase();
      if (ap !== bp) return ap.localeCompare(bp);
      const am = (a.alumno?.apellido_materno || '').toLowerCase();
      const bm = (b.alumno?.apellido_materno || '').toLowerCase();
      if (am !== bm) return am.localeCompare(bm);
      const an = (a.alumno?.nombres || '').toLowerCase();
      const bn = (b.alumno?.nombres || '').toLowerCase();
      if (an !== bn) return an.localeCompare(bn);
      const ad = (a.alumno?.numero_documento || '').toLowerCase();
      const bd = (b.alumno?.numero_documento || '').toLowerCase();
      return ad.localeCompare(bd);
    });

  const resumenPorAlumno = alumnos.map((a) => ({
    id_alumno: a.id_alumno,
    alumno: a.alumno,
    totales: resumenPorAlumnoMap.get(a.id_alumno) || { presente: 0, ausente: 0, tarde: 0, justificado: 0, total_registros: 0 },
  }));

  return {
    aula,
    rango: { desde: desdeFecha, hasta: hastaFecha },
    fechas,
    sesiones_tomadas: fechas.length,
    alumnos,
    asistencias: asistenciasFlat,
    resumen_general: resumenGeneral,
    resumen_por_alumno: resumenPorAlumno,
  };
};

/**
 * Crea el grupo de WhatsApp de un aula:
 * 1. Arma el nombre del grupo con curso + día/horario + ciclo.
 * 2. Recolecta los teléfonos válidos de los alumnos del aula (AulaAlumno -> Persona).
 * 3. Llama al servicio externo de WhatsApp.
 * 4. Guarda nombre_grupo_whatsapp e id_grupo_whatsapp en el aula.
 */
exports.crearGrupoWhatsappAula = async (idAula) => {
  const aula = await Aula.findById(idAula).lean();
  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const [curso, ciclo] = await Promise.all([
    Curso.findById(aula.id_curso).select('nombre_curso').lean(),
    Ciclo.findById(aula.id_ciclo).select('nombre_ciclo').lean(),
  ]);

  if (!curso) {
    const err = new Error('Curso del aula no encontrado');
    err.statusCode = 404;
    throw err;
  }
  if (!ciclo) {
    const err = new Error('Ciclo del aula no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const nombreGrupo = `${curso.nombre_curso} - ${aula.dia} ${aula.hora_inicio} a ${aula.hora_fin} - ${ciclo.nombre_ciclo}`;

  // Recolectar y validar teléfonos de los alumnos del aula
  const aulaAlumnos = await AulaAlumno.find({ id_aula: idAula })
    .populate({ path: 'id_alumno', select: 'telefono' })
    .lean();

  const telefonosUnicos = new Set();
  for (const aa of aulaAlumnos) {
    const telefono = aa.id_alumno?.telefono;
    if (telefono && TELEFONO_VALIDO_REGEX.test(telefono)) {
      telefonosUnicos.add(telefono);
    }
  }

  const participantes = Array.from(telefonosUnicos);
  if (participantes.length === 0) {
    const err = new Error('No hay alumnos con un teléfono válido (9 dígitos, debe iniciar con 9) en esta aula');
    err.statusCode = 400;
    throw err;
  }

  // WhatsApp aplica límites anti-spam si se agrega a muchas personas de golpe:
  // se crea el grupo con un primer lote pequeño y el resto se agrega en lotes de 5.
  const TAMANO_LOTE = 5;
  const ESPERA_ENTRE_LOTES_MS = 8000;

  const [primerLote, ...lotesRestantes] = chunk(participantes, TAMANO_LOTE);

  const respuestaWhatsapp = await crearGrupoWhatsApp(nombreGrupo, primerLote);
  const groupId = respuestaWhatsapp.data?.groupId;

  const fallosAgregar = [];
  for (const lote of lotesRestantes) {
    if (!groupId) {
      fallosAgregar.push({ lote, error: 'No se obtuvo groupId al crear el grupo' });
      continue;
    }
    await sleep(ESPERA_ENTRE_LOTES_MS);
    try {
      await agregarParticipantesGrupo(groupId, lote);
    } catch (err) {
      fallosAgregar.push({ lote, error: err.message });
    }
  }

  const aulaActualizada = await Aula.findByIdAndUpdate(
    idAula,
    {
      nombre_grupo_whatsapp: respuestaWhatsapp.data?.name || nombreGrupo,
      id_grupo_whatsapp: groupId || null,
    },
    { new: true }
  ).lean();

  return {
    aula: aulaActualizada,
    whatsapp: respuestaWhatsapp.data,
    participantes_invitados: participantes,
    participantes_pendientes: fallosAgregar.flatMap((f) => f.lote),
    errores_al_agregar: fallosAgregar.length ? fallosAgregar.map((f) => f.error) : undefined,
  };
};

function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
