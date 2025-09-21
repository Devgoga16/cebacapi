const Asistencia = require('../models/asistencia');
const AulaAlumno = require('../models/aulaalumno');
const Aula = require('../models/aula');

function normalizeToLocalDayUTC(dateInput) {
  const now = dateInput ? new Date(dateInput) : new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
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
