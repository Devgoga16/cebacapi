const AulaAlumno = require('../models/aulaalumno');
const { compressBase64Image } = require('../utils/image');

exports.getAllAulaAlumnos = async () => {
  return await AulaAlumno.find().populate('id_aula id_alumno');
};

exports.getAulaAlumnoById = async (id) => {
  return await AulaAlumno.findById(id).populate('id_aula id_alumno');
};

exports.createAulaAlumno = async (data) => {
  // Si viene carta_pastoral base64, comprimimos antes de guardar
  if (data && data.carta_pastoral && data.carta_pastoral.data) {
    try {
      const { base64, mimetype, size } = await compressBase64Image(data.carta_pastoral.data, { maxWidth: 1024, quality: 75, format: 'jpeg' });
      data.carta_pastoral.data = base64;
      data.carta_pastoral.mimetype = data.carta_pastoral.mimetype || mimetype;
      data.carta_pastoral.size = size;
      // Si el filename apunta a .png u otro, opcionalmente podríamos cambiar a .jpg, pero mantenemos si viene
    } catch (e) {
      console.error('Fallo al comprimir carta_pastoral en createAulaAlumno:', e?.message || e);
    }
  }
  const aulaAlumno = new AulaAlumno(data);
  return await aulaAlumno.save();
};

exports.updateAulaAlumno = async (id, data) => {
  // Comprimir carta_pastoral si viene nueva imagen
  if (data && data.carta_pastoral && data.carta_pastoral.data) {
    try {
      const { base64, mimetype, size } = await compressBase64Image(data.carta_pastoral.data, { maxWidth: 1024, quality: 75, format: 'jpeg' });
      data.carta_pastoral.data = base64;
      data.carta_pastoral.mimetype = data.carta_pastoral.mimetype || mimetype;
      data.carta_pastoral.size = size;
    } catch (e) {
      console.error('Fallo al comprimir carta_pastoral en updateAulaAlumno:', e?.message || e);
    }
  }
  return await AulaAlumno.findByIdAndUpdate(id, data, { new: true }).populate('id_aula id_alumno');
};

exports.deleteAulaAlumno = async (id) => {
  const result = await AulaAlumno.findByIdAndDelete(id);
  return !!result;
};

// Lista todos los registros de AulaAlumno de una persona, con la mayor cantidad de datos poblados
exports.getAulaAlumnosPorPersona = async (id_persona, options = {}) => {
  const { groupBy } = options || {};
  const registros = await AulaAlumno.find({ id_alumno: id_persona })
    .populate({
      path: 'id_aula',
      populate: [
        { path: 'id_curso', populate: { path: 'id_nivel' } },
        { path: 'id_ciclo' },
        { path: 'id_profesor' }
      ]
    })
    .populate({
      path: 'id_alumno',
      populate: [
        { path: 'id_user', populate: { path: 'roles' } },
        { path: 'id_ministerio', populate: { path: 'id_iglesia' } }
      ]
    });

  if (groupBy === 'ciclo') {
    const grupos = new Map();
    for (const reg of registros) {
      const cicloDoc = reg?.id_aula?.id_ciclo || null;
      const key = cicloDoc ? String(cicloDoc._id || cicloDoc) : 'sin_ciclo';
      if (!grupos.has(key)) grupos.set(key, { ciclo: cicloDoc, registros: [] });
      grupos.get(key).registros.push(reg);
    }
    // Ordenar: primero ciclos con inscripcionesabiertas=true, luego actual=true, luego por fecha_inicio desc; 'sin_ciclo' al final
    return Array.from(grupos.values()).sort((a, b) => {
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
  }

  return registros;
};

// Inserción masiva de AulaAlumno: recibe id_alumno y lista de id_aulas y crea registros con estado 'inscrito'
// También puede recibir carta_pastoral como array (uno por cada aula) o como objeto único (aplicado a todos)
// Omite pares que ya existan (id_alumno + id_aula) y devuelve un resumen
exports.bulkCreateAulaAlumnos = async (id_alumno, id_aulas, additionalData = {}) => {
  if (!id_alumno) {
    const err = new Error('id_alumno es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(id_aulas) || id_aulas.length === 0) {
    const err = new Error('id_aulas debe ser un arreglo con al menos un elemento');
    err.statusCode = 400;
    throw err;
  }

  // Normalizar y deduplicar ids de aulas
  const requestedIds = Array.from(new Set(id_aulas.filter(Boolean).map(String)));
  if (requestedIds.length === 0) {
    return { insertedCount: 0, insertedIds: [], skippedExisting: [], totalRequested: 0 };
  }

  // Buscar existentes para no duplicar
  const existentes = await AulaAlumno.find({ id_alumno, id_aula: { $in: requestedIds } })
    .select('id_aula')
    .lean();
  const existentesSet = new Set(existentes.map(e => String(e.id_aula)));

  const toInsertIds = requestedIds.filter(id => !existentesSet.has(id));

  // Preparar documentos con carta_pastoral específica por aula
  // carta_pastoral puede ser:
  // - Objeto único: aplicado a todos los registros
  // - Array: carta_pastoral[index] asignada al registro correspondiente
  const docs = [];
  for (let index = 0; index < toInsertIds.length; index++) {
    const id_aula = toInsertIds[index];
    const doc = { id_aula, id_alumno, estado: 'pendiente' };

    // Procesar carta_pastoral si existe
    if (additionalData.carta_pastoral) {
      let cartaPastoralData = null;

      if (Array.isArray(additionalData.carta_pastoral)) {
        // Si hay carta_pastoral para este índice, usarla
        if (additionalData.carta_pastoral[index]) {
          cartaPastoralData = additionalData.carta_pastoral[index];
        }
      } else {
        // Si es un objeto único, aplicarlo a todos
        cartaPastoralData = additionalData.carta_pastoral;
      }

      // Si tenemos datos de carta_pastoral, comprimir la imagen base64
      if (cartaPastoralData && cartaPastoralData.data) {
        try {
          const { base64, mimetype, size } = await compressBase64Image(cartaPastoralData.data, { maxWidth: 1024, quality: 75, format: 'jpeg' });
          doc.carta_pastoral = {
            data: base64,
            filename: cartaPastoralData.filename,
            mimetype: cartaPastoralData.mimetype || mimetype,
            size: size
          };
        } catch (e) {
          console.error('Fallo al comprimir carta_pastoral en bulkCreateAulaAlumnos:', e?.message || e);
          // Si falla la compresión, guardar los datos originales
          doc.carta_pastoral = cartaPastoralData;
        }
      } else if (cartaPastoralData) {
        // Si no hay data pero sí otros campos, guardarlos
        doc.carta_pastoral = cartaPastoralData;
        doc.estado = 'inscrito';
      }
    }

    docs.push(doc);
  }

  let inserted = [];
  if (docs.length > 0) {
    const result = await AulaAlumno.insertMany(docs, { ordered: false });
    inserted = result.map(d => String(d._id));
  }

  return {
    insertedCount: inserted.length,
    insertedIds: inserted,
    skippedExisting: Array.from(existentesSet),
    totalRequested: requestedIds.length,
  };
};

// Inscribe un AulaAlumno cambiando su estado a 'inscrito'
exports.inscribirAulaAlumno = async (id) => {
  const aulaAlumno = await AulaAlumno.findByIdAndUpdate(
    id,
    { estado: 'inscrito' },
    { new: true }
  ).populate('id_aula id_alumno');

  if (!aulaAlumno) {
    const err = new Error('AulaAlumno no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return aulaAlumno;
};

