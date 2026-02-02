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
