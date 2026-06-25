const PenaCalificacion = require('../models/penaCalificacion');
const AulaAlumno = require('../models/aulaalumno');
const Aula = require('../models/aula');

const compararAlumnos = (a, b) => {
  const pa = (a.alumno?.apellido_paterno || '').localeCompare(b.alumno?.apellido_paterno || '', 'es');
  if (pa !== 0) return pa;
  const ma = (a.alumno?.apellido_materno || '').localeCompare(b.alumno?.apellido_materno || '', 'es');
  if (ma !== 0) return ma;
  return (a.alumno?.nombres || '').localeCompare(b.alumno?.nombres || '', 'es');
};

/**
 * Obtiene el roster de un aula para una lección específica de peña:
 * cada alumno con sus notas registradas por sección, ordenado alfabéticamente.
 */
exports.getRosterPena = async (id_aula, leccion) => {
  const aulaDoc = await Aula.findById(id_aula).lean();
  if (!aulaDoc) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  const alumnosAA = await AulaAlumno.find({ id_aula })
    .populate({
      path: 'id_alumno',
      select: 'nombres apellido_paterno apellido_materno numero_documento',
    })
    .lean();

  const filtro = { id_aula };
  if (leccion) filtro.leccion = leccion;

  const registros = leccion ? await PenaCalificacion.find(filtro).lean() : [];

  const mapPorAlumno = new Map();
  registros.forEach((r) => {
    const aid = String(r.id_alumno);
    if (!mapPorAlumno.has(aid)) mapPorAlumno.set(aid, []);
    mapPorAlumno.get(aid).push(r);
  });

  const alumnos = alumnosAA.map((aa) => {
    const aid = String(aa.id_alumno?._id || aa.id_alumno);
    const secciones = (mapPorAlumno.get(aid) || [])
      .map((r) => ({
        seccion: r.seccion,
        nota: r.nota,
        comentario: r.comentario || '',
      }))
      .sort((a, b) => a.seccion.localeCompare(b.seccion));

    return {
      id_alumno: aid,
      alumno: aa.id_alumno,
      estado_inscripcion: aa.estado,
      secciones,
    };
  });

  alumnos.sort(compararAlumnos);

  return { aula: aulaDoc, leccion: leccion || null, alumnos };
};

/**
 * Guarda/actualiza en lote las notas de una lección de peña.
 * items: [{ id_alumno, seccion, nota, comentario }]
 */
exports.guardarNotasPena = async ({ id_aula, leccion, items, registrado_por }) => {
  if (!leccion || !String(leccion).trim()) {
    const err = new Error('Se requiere indicar la lección');
    err.statusCode = 400;
    throw err;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('items debe ser un arreglo con al menos un elemento');
    err.statusCode = 400;
    throw err;
  }

  const aula = await Aula.findById(id_aula);
  if (!aula) {
    const err = new Error('Aula no encontrada');
    err.statusCode = 404;
    throw err;
  }

  for (const it of items) {
    if (!it.id_alumno || !it.seccion) {
      const err = new Error('Cada item requiere id_alumno y seccion');
      err.statusCode = 400;
      throw err;
    }

    const nota = Number(it.nota);
    if (isNaN(nota) || nota < 0 || nota > 20) {
      const err = new Error(`La nota debe estar entre 0 y 20. Valor recibido: ${it.nota}`);
      err.statusCode = 400;
      throw err;
    }
  }

  const ops = items.map((it) => ({
    updateOne: {
      filter: {
        id_aula,
        id_alumno: it.id_alumno,
        leccion: String(leccion).trim(),
        seccion: String(it.seccion).trim(),
      },
      update: {
        $set: {
          nota: Number(it.nota),
          comentario: it.comentario || '',
          registrado_por: registrado_por || null,
        },
      },
      upsert: true,
    },
  }));

  const result = await PenaCalificacion.bulkWrite(ops, { ordered: false });

  return {
    matched: result.matchedCount || 0,
    modified: result.modifiedCount || 0,
    upserts: result.upsertedCount || 0,
  };
};

/**
 * Lista las lecciones que ya tienen notas registradas en un aula (para navegación/historial).
 */
exports.getLeccionesRegistradas = async (id_aula) => {
  const lecciones = await PenaCalificacion.distinct('leccion', { id_aula });
  return lecciones.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

/**
 * Elimina una lección completa de un aula, junto con todas las notas de sus secciones.
 */
exports.eliminarLeccion = async (id_aula, leccion) => {
  if (!leccion) {
    const err = new Error('Se requiere indicar la lección');
    err.statusCode = 400;
    throw err;
  }

  const result = await PenaCalificacion.deleteMany({ id_aula, leccion });
  return { eliminadas: result.deletedCount || 0 };
};

/**
 * Elimina una sección de una lección de un aula, junto con las notas registradas en ella.
 */
exports.eliminarSeccion = async (id_aula, leccion, seccion) => {
  if (!leccion || !seccion) {
    const err = new Error('Se requiere indicar la lección y la sección');
    err.statusCode = 400;
    throw err;
  }

  const result = await PenaCalificacion.deleteMany({ id_aula, leccion, seccion });
  return { eliminadas: result.deletedCount || 0 };
};
