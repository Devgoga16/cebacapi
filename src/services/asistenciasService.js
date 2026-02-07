const Asistencia = require('../models/asistencia');
const AulaAlumno = require('../models/aulaalumno');
const Aula = require('../models/aula');
const Persona = require('../models/persona');

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

// Devuelve la lista base de alumnos de un aula para tomar asistencia en una fecha: incluye estado previo si existe
exports.getRosterDeAulaParaAsistencia = async (id_aula, fecha) => {
  const fechaClave = normalizeToLocalDayUTC(fecha);
  // roster: todos los alumnos vinculados al aula (AulaAlumno)
  const alumnosAA = await AulaAlumno.find({ id_aula })
    .populate({
      path: 'id_alumno',
      select: 'nombres apellido_paterno apellido_materno numero_documento',
    })
    .lean();

  const alumnoIds = alumnosAA.map((x) => x.id_alumno?._id || x.id_alumno).filter(Boolean);
  const asistencias = await Asistencia.find({ id_aula, id_alumno: { $in: alumnoIds }, fecha: fechaClave })
    .lean();
  const mapAsistencia = new Map(asistencias.map((a) => [String(a.id_alumno), a]));

  // Enriquecer con curso, ciclo, profesor para header
  const aulaDoc = await Aula.findById(id_aula)
    .populate([
      { path: 'id_curso', populate: { path: 'id_nivel' } },
      { path: 'id_ciclo' },
      { path: 'id_profesor', select: '-imagen' },
    ])
    .lean();

  const roster = alumnosAA.map((aa) => {
    const aid = String(aa.id_alumno?._id || aa.id_alumno);
    const existente = mapAsistencia.get(aid);
    return {
      id_alumno: aid,
      alumno: aa.id_alumno,
      estado: existente?.estado || null,
      observacion: existente?.observacion || '',
    };
  });

  return { aula: aulaDoc, fecha: fechaClave, alumnos: roster };
};

// Tomar asistencia en lote. items: [{id_aula, id_alumno, estado, observacion}]
exports.tomarAsistencia = async ({ items, tomado_por, fecha }) => {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('items debe ser un arreglo con al menos un elemento');
    err.statusCode = 400; throw err;
  }
  const fechaClave = normalizeToLocalDayUTC(fecha);
  // Validar estados
  const validStates = new Set(['presente', 'ausente', 'tarde', 'justificado']);
  for (const it of items) {
    if (!it.id_aula || !it.id_alumno || !it.estado) {
      const err = new Error('Cada item requiere id_aula, id_alumno y estado');
      err.statusCode = 400; throw err;
    }
    if (!validStates.has(String(it.estado))) {
      const err = new Error(`Estado inválido: ${it.estado}`);
      err.statusCode = 400; throw err;
    }
  }

  // Upsert por (id_aula, id_alumno, fecha)
  const ops = items.map((it) => ({
    updateOne: {
      filter: { id_aula: it.id_aula, id_alumno: it.id_alumno, fecha: fechaClave },
      update: {
        $set: {
          estado: it.estado,
          observacion: it.observacion || '',
          tomado_por: tomado_por || null,
        }
      },
      upsert: true,
    }
  }));

  const result = await Asistencia.bulkWrite(ops, { ordered: false });
  return {
    fecha: fechaClave,
    matched: result.matchedCount || 0,
    modified: result.modifiedCount || 0,
    upserts: result.upsertedCount || 0,
  };
};

// Consulta asistencias de un aula por fecha
exports.getAsistenciasDeAulaPorFecha = async (id_aula, fecha) => {
  const fechaClave = normalizeToLocalDayUTC(fecha);
  const docs = await Asistencia.find({ id_aula, fecha: fechaClave })
    .populate({ path: 'id_alumno', select: 'nombres apellido_paterno apellido_materno numero_documento' })
    .lean();
  return { fecha: fechaClave, asistencias: docs };
};

// Resumen y detalle de asistencia de un alumno en un aula
// Inputs: id_aula, id_alumno, desde (YYYY-MM-DD opcional), hasta (YYYY-MM-DD opcional)
// Output:
// {
//   aula,
//   alumno,
//   rango: { desde, hasta },
//   resumen: { presente, ausente, tarde, justificado, total_registros, porcentaje_presente, porcentaje_efectivo },
//   detalle: [ { fecha, estado, observacion, tomado_por } ]
// }
exports.getResumenDetalleAsistenciaAlumno = async (id_aula, id_alumno, { desde, hasta } = {}) => {
  if (!id_aula || !id_alumno) {
    const err = new Error('id_aula e id_alumno son requeridos');
    err.statusCode = 400;
    throw err;
  }

  const [aula, alumno, vinculacion] = await Promise.all([
    Aula.findById(id_aula)
      .populate([
        { path: 'id_curso', populate: { path: 'id_nivel' } },
        { path: 'id_ciclo' },
        { path: 'id_profesor', select: '-imagen' },
      ])
      .lean(),
    Persona.findById(id_alumno)
      .select('nombres apellido_paterno apellido_materno numero_documento')
      .lean(),
    AulaAlumno.findOne({ id_aula, id_alumno }).lean(),
  ]);

  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }
  if (!alumno) {
    const err = new Error('Alumno no encontrado');
    err.statusCode = 404;
    throw err;
  }
  if (!vinculacion) {
    const err = new Error('Alumno no está asociado al aula');
    err.statusCode = 404;
    throw err;
  }

  let desdeFecha = null;
  let hastaFecha = null;
  if (desde) desdeFecha = normalizeToLocalDayUTC(desde);
  if (hasta) hastaFecha = normalizeToLocalDayUTC(hasta);

  if (desdeFecha && hastaFecha && desdeFecha > hastaFecha) {
    const err = new Error('El rango de fechas es inválido: desde > hasta');
    err.statusCode = 400;
    throw err;
  }

  const filter = { id_aula, id_alumno };
  if (desdeFecha || hastaFecha) {
    filter.fecha = {};
    if (desdeFecha) filter.fecha.$gte = desdeFecha;
    if (hastaFecha) filter.fecha.$lte = hastaFecha;
  }

  const docs = await Asistencia.find(filter)
    .sort({ fecha: 1 })
    .populate({ path: 'tomado_por', select: 'nombres apellido_paterno apellido_materno numero_documento' })
    .lean();

  const resumen = { presente: 0, ausente: 0, tarde: 0, justificado: 0, total_registros: 0 };
  for (const d of docs) {
    if (d.estado in resumen) resumen[d.estado] += 1;
    resumen.total_registros += 1;
  }
  const total = resumen.total_registros || 0;
  const porcentaje_presente = total > 0 ? (resumen.presente * 100) / total : 0;
  const efectivo = resumen.presente + resumen.tarde;
  const porcentaje_efectivo = total > 0 ? (efectivo * 100) / total : 0;

  const detalle = docs.map((d) => ({
    fecha: d.fecha,
    estado: d.estado,
    observacion: d.observacion || '',
    tomado_por: d.tomado_por || null,
  }));

  return {
    aula,
    alumno,
    rango: { desde: desdeFecha, hasta: hastaFecha },
    resumen: {
      ...resumen,
      porcentaje_presente: Number(porcentaje_presente.toFixed(2)),
      porcentaje_efectivo: Number(porcentaje_efectivo.toFixed(2)),
    },
    detalle,
  };
};

// Reporte de asistencias por ciclo con KPIs separados por género
// Input: id_ciclo
// Output:
// {
//   ciclo,
//   alumnos_inscritos: { masculino, femenino, total },
//   porcentaje_asistencia_alumnos: { masculino, femenino, total },
//   profesores_asignados: { masculino, femenino, total },
//   porcentaje_asistencia_profesores: { masculino, femenino, total }
// }
exports.getReporteAsistenciasPorCiclo = async (id_ciclo) => {
  if (!id_ciclo) {
    const err = new Error('id_ciclo es requerido');
    err.statusCode = 400;
    throw err;
  }

  // 1. Obtener todas las aulas del ciclo con profesores
  const aulas = await Aula.find({ id_ciclo })
    .populate('id_ciclo')
    .populate('id_profesor')
    .lean();

  if (aulas.length === 0) {
    const err = new Error('No se encontraron aulas para este ciclo');
    err.statusCode = 404;
    throw err;
  }

  const aulasIds = aulas.map((a) => a._id);
  const ciclo = aulas[0].id_ciclo;

  // 2. KPI 1: Cantidad de alumnos inscritos por género (usar AulaAlumno)
  const aulaalumnos = await AulaAlumno.find({ 
    id_aula: { $in: aulasIds }
  })
    .populate('id_alumno')
    .lean();

  const alumnosUnicos = new Map();
  for (const aa of aulaalumnos) {
    if (aa.id_alumno) {
      const alumnoId = String(aa.id_alumno._id);
      if (!alumnosUnicos.has(alumnoId)) {
        alumnosUnicos.set(alumnoId, aa.id_alumno);
      }
    }
  }

  const alumnosArray = Array.from(alumnosUnicos.values());
  const alumnosMasculino = alumnosArray.filter((a) => a.genero === 'M').length;
  const alumnosFemenino = alumnosArray.filter((a) => a.genero === 'F').length;

  // 3. KPI 2: Porcentaje de asistencia de alumnos por género
  // Obtener IDs de profesores para excluirlos de las asistencias de alumnos
  const profesoresIds = aulas.map((a) => String(a.id_profesor._id));
  const alumnosIds = alumnosArray.map((a) => String(a._id));
  
  const asistenciasAlumnos = await Asistencia.find({
    id_aula: { $in: aulasIds },
    id_alumno: { $in: alumnosIds, $nin: profesoresIds }
  }).lean();

  // Agrupar asistencias de alumnos por género
  const asistenciasPorAlumno = new Map();
  for (const asist of asistenciasAlumnos) {
    const alumnoId = String(asist.id_alumno);
    if (!asistenciasPorAlumno.has(alumnoId)) {
      asistenciasPorAlumno.set(alumnoId, []);
    }
    asistenciasPorAlumno.get(alumnoId).push(asist);
  }

  let totalPresenciasAlumnosM = 0;
  let totalAsistenciasAlumnosM = 0;
  let totalPresenciasAlumnosF = 0;
  let totalAsistenciasAlumnosF = 0;

  for (const alumno of alumnosArray) {
    const alumnoId = String(alumno._id);
    const asistencias = asistenciasPorAlumno.get(alumnoId) || [];
    const presencias = asistencias.filter((a) => a.estado === 'presente' || a.estado === 'tarde').length;
    const total = asistencias.length;

    if (alumno.genero === 'M') {
      totalPresenciasAlumnosM += presencias;
      totalAsistenciasAlumnosM += total;
    } else if (alumno.genero === 'F') {
      totalPresenciasAlumnosF += presencias;
      totalAsistenciasAlumnosF += total;
    }
  }

  const porcentajeAsistenciaAlumnosM = totalAsistenciasAlumnosM > 0
    ? Number(((totalPresenciasAlumnosM / totalAsistenciasAlumnosM) * 100).toFixed(2))
    : 0;
  const porcentajeAsistenciaAlumnosF = totalAsistenciasAlumnosF > 0
    ? Number(((totalPresenciasAlumnosF / totalAsistenciasAlumnosF) * 100).toFixed(2))
    : 0;
  const porcentajeAsistenciaAlumnosTotal = (totalAsistenciasAlumnosM + totalAsistenciasAlumnosF) > 0
    ? Number((((totalPresenciasAlumnosM + totalPresenciasAlumnosF) / (totalAsistenciasAlumnosM + totalAsistenciasAlumnosF)) * 100).toFixed(2))
    : 0;

  // 4. KPI 3: Cantidad de profesores asignados por género
  const profesoresUnicos = new Map();
  for (const aula of aulas) {
    if (aula.id_profesor) {
      const profesorId = String(aula.id_profesor._id);
      if (!profesoresUnicos.has(profesorId)) {
        profesoresUnicos.set(profesorId, aula.id_profesor);
      }
    }
  }

  const profesoresArray = Array.from(profesoresUnicos.values());
  const profesoresMasculino = profesoresArray.filter((p) => p.genero === 'M').length;
  const profesoresFemenino = profesoresArray.filter((p) => p.genero === 'F').length;

  // 5. KPI 4: Porcentaje de asistencia de profesores por género
  // Los profesores se registran con id_alumno = id_profesor del aula
  const profesoresIdsArray = profesoresArray.map((p) => p._id);
  const asistenciasProfesores = await Asistencia.find({
    id_aula: { $in: aulasIds },
    id_alumno: { $in: profesoresIdsArray }
  }).lean();

  // Agrupar asistencias de profesores por género
  const asistenciasPorProfesor = new Map();
  for (const asist of asistenciasProfesores) {
    const profesorId = String(asist.id_alumno);
    if (!asistenciasPorProfesor.has(profesorId)) {
      asistenciasPorProfesor.set(profesorId, []);
    }
    asistenciasPorProfesor.get(profesorId).push(asist);
  }

  let totalPresenciasProfesoresM = 0;
  let totalAsistenciasProfesoresM = 0;
  let totalPresenciasProfesoresF = 0;
  let totalAsistenciasProfesoresF = 0;

  for (const profesor of profesoresArray) {
    const profesorId = String(profesor._id);
    const asistencias = asistenciasPorProfesor.get(profesorId) || [];
    const presencias = asistencias.filter((a) => a.estado === 'presente' || a.estado === 'tarde').length;
    const total = asistencias.length;

    if (profesor.genero === 'M') {
      totalPresenciasProfesoresM += presencias;
      totalAsistenciasProfesoresM += total;
    } else if (profesor.genero === 'F') {
      totalPresenciasProfesoresF += presencias;
      totalAsistenciasProfesoresF += total;
    }
  }

  const porcentajeAsistenciaProfesoresM = totalAsistenciasProfesoresM > 0
    ? Number(((totalPresenciasProfesoresM / totalAsistenciasProfesoresM) * 100).toFixed(2))
    : 0;
  const porcentajeAsistenciaProfesoresF = totalAsistenciasProfesoresF > 0
    ? Number(((totalPresenciasProfesoresF / totalAsistenciasProfesoresF) * 100).toFixed(2))
    : 0;
  const porcentajeAsistenciaProfesoresTotal = (totalAsistenciasProfesoresM + totalAsistenciasProfesoresF) > 0
    ? Number((((totalPresenciasProfesoresM + totalPresenciasProfesoresF) / (totalAsistenciasProfesoresM + totalAsistenciasProfesoresF)) * 100).toFixed(2))
    : 0;

  return {
    ciclo: {
      _id: ciclo._id,
      nombre: ciclo.nombre,
      anio: ciclo.anio,
    },
    alumnos_inscritos: {
      masculino: alumnosMasculino,
      femenino: alumnosFemenino,
      total: alumnosMasculino + alumnosFemenino,
    },
    porcentaje_asistencia_alumnos: {
      masculino: porcentajeAsistenciaAlumnosM,
      femenino: porcentajeAsistenciaAlumnosF,
      total: porcentajeAsistenciaAlumnosTotal,
    },
    profesores_asignados: {
      masculino: profesoresMasculino,
      femenino: profesoresFemenino,
      total: profesoresMasculino + profesoresFemenino,
    },
    porcentaje_asistencia_profesores: {
      masculino: porcentajeAsistenciaProfesoresM,
      femenino: porcentajeAsistenciaProfesoresF,
      total: porcentajeAsistenciaProfesoresTotal,
    },
  };
};

// Reporte de alumnos por ministerio y género por ciclo
// Input: id_ciclo
// Output: Array de { id_ministerio, ministerio, masculino, femenino, total }
exports.getAlumnosPorMinisterioPorCiclo = async (id_ciclo) => {
  if (!id_ciclo) {
    const err = new Error('id_ciclo es requerido');
    err.statusCode = 400;
    throw err;
  }

  // 1. Obtener todas las aulas del ciclo
  const aulas = await Aula.find({ id_ciclo }).lean();

  if (aulas.length === 0) {
    const err = new Error('No se encontraron aulas para este ciclo');
    err.statusCode = 404;
    throw err;
  }

  const aulasIds = aulas.map((a) => a._id);

  // 2. Obtener todos los AulaAlumno con sus personas
  const aulaalumnos = await AulaAlumno.find({ 
    id_aula: { $in: aulasIds }
  })
    .populate({
      path: 'id_alumno',
      populate: { path: 'id_ministerio' }
    })
    .lean();

  // 3. Agrupar por ministerio y contar por género
  const ministeriosMap = new Map();

  for (const aa of aulaalumnos) {
    if (!aa.id_alumno) continue;

    const alumno = aa.id_alumno;
    const ministerioId = alumno.id_ministerio?._id ? String(alumno.id_ministerio._id) : 'sin_ministerio';
    const ministerioNombre = alumno.id_ministerio?.nombre || 'Sin Ministerio';

    if (!ministeriosMap.has(ministerioId)) {
      ministeriosMap.set(ministerioId, {
        id_ministerio: ministerioId === 'sin_ministerio' ? null : ministerioId,
        ministerio: ministerioNombre,
        masculino: 0,
        femenino: 0,
        total: 0,
        alumnos: new Set()
      });
    }

    const ministerioData = ministeriosMap.get(ministerioId);
    const alumnoId = String(alumno._id);

    // Evitar duplicados (un alumno puede estar en varias aulas del mismo ciclo)
    if (!ministerioData.alumnos.has(alumnoId)) {
      ministerioData.alumnos.add(alumnoId);

      if (alumno.genero === 'M') {
        ministerioData.masculino += 1;
      } else if (alumno.genero === 'F') {
        ministerioData.femenino += 1;
      }
      ministerioData.total += 1;
    }
  }

  // 4. Convertir a array y eliminar el Set de alumnos
  const resultado = Array.from(ministeriosMap.values()).map(({ alumnos, ...rest }) => rest);

  // Ordenar por total descendente
  resultado.sort((a, b) => b.total - a.total);

  return resultado;
};
