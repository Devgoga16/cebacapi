const Aula = require('../models/aula');
const AulaAlumno = require('../models/aulaalumno');
const Inscripcion = require('../models/inscripcion');
const Asistencia = require('../models/asistencia');
const mongoose = require('mongoose');

function normalizeToLocalDayUTC(dateInput) {
  const now = dateInput ? new Date(dateInput) : new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

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
        select: 'nombres apellido_paterno apellido_materno numero_documento',
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
