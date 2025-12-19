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

// Lista aulas disponibles para inscripción en el ciclo actual para una persona
// Excluye:
//  - aulas de cursos que la persona ya ha llevado (AulaAlumno estado 'aprobado' o 'en curso')
//  - aulas de cursos para los que la persona ya tiene una Inscripción en el ciclo abierto (estado 'Pendiente' o 'Aceptado')
// Devuelve { cicloActual, niveles }
exports.getAulasDisponiblesParaInscripcion = async (id_persona) => {
  // Seleccionar ciclo con inscripciones abiertas; si hay varios, elegir el más reciente por fecha_inicio
  const cicloActual = await Ciclo.findOne({ inscripcionesabiertas: true }).sort({ fecha_inicio: -1 });
  if (!cicloActual) return { cicloActual: null, niveles: [] };

  // 1) Obtener cursos que la persona ya ha llevado (estado 'aprobado' o 'en curso') y los que tiene APROBADOS (para validar prerequisitos)
  let cursosLlevados = new Set();
  let cursosAprobados = new Set();
  if (id_persona) {
    const regs = await AulaAlumno.find({ id_alumno: id_persona, estado: { $in: ['aprobado', 'en curso', 'inscrito', 'pendiente'] } })
      .select('id_aula estado')
      .populate({ path: 'id_aula', select: 'id_curso' })
      .lean();
    const llevados = [];
    const aprobados = [];
    for (const r of regs) {
      const cursoId = r?.id_aula?.id_curso;
      if (!cursoId) continue;
      llevados.push(String(cursoId));
      if (String(r?.estado || '').toLowerCase() === 'aprobado') {
        aprobados.push(String(cursoId));
      }
    }
    cursosLlevados = new Set(llevados);
    cursosAprobados = new Set(aprobados);
  }

  const aulas = await Aula.find({ id_ciclo: cicloActual._id })
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
    .populate({ path: 'id_profesor', select: '-imagen' })
    .populate('id_ciclo')
    .lean();

  // Obtener conteo de inscritos por aula
  const aulaIdsDelCiclo = aulas.map(a => a._id);
  const conteosInscritos = await AulaAlumno.aggregate([
    { $match: { id_aula: { $in: aulaIdsDelCiclo }, estado: "inscrito" } },
    { $group: { _id: "$id_aula", count: { $sum: 1 } } }
  ]);
  const conteoMap = new Map(conteosInscritos.map(c => [String(c._id), c.count]));

  // 2) Obtener cursos para los que ya existe una Inscripción del alumno en este ciclo (Pendiente o Aceptado)
  let cursosConInscripcion = new Set();
  if (id_persona) {
    const aulaIdsDelCiclo = aulas.map(a => String(a._id));
    if (aulaIdsDelCiclo.length) {
      const inscs = await Inscripcion.find({
        id_alumno: id_persona,
        estado: { $in: ['Pendiente', 'Aceptado'] },
        id_aula: { $in: aulaIdsDelCiclo }
      }).select('id_aula').lean();

      // Mapear id_aula -> id_curso usando las aulas ya cargadas
      const mapaAulaCurso = new Map(aulas.map(a => [String(a._id), String(a?.id_curso?._id || '')]));
      cursosConInscripcion = new Set(
        inscs
          .map(i => mapaAulaCurso.get(String(i.id_aula)))
          .filter(Boolean)
      );
    }
  }

  // 3) Si hay persona, preparar validación de prerequisitos por curso
  //    - Para prerequisitos de tipo 'Curso': debe estar en cursosAprobados
  //    - Para prerequisitos de tipo 'Nivel': debe tener aprobados todos los cursos NO electivos de ese nivel (excepto el propio curso)
  let cursosNoElectivosPorNivel = new Map();
  if (id_persona) {
    const todosCursos = await require('../models/curso')
      .find()
      .select('_id id_nivel electivo')
      .lean();
    for (const c of todosCursos) {
      const nivelId = c?.id_nivel ? String(c.id_nivel) : null;
      if (!nivelId) continue;
      if (!cursosNoElectivosPorNivel.has(nivelId)) cursosNoElectivosPorNivel.set(nivelId, []);
      if (c.electivo !== true) {
        cursosNoElectivosPorNivel.get(nivelId).push(String(c._id));
      }
    }
  }

  function esAptoParaCurso(cursoDoc) {
    if (!id_persona) return true; // si no hay persona, no aplicamos restricciones
    if (!cursoDoc) return false;
    const prereqs = Array.isArray(cursoDoc.prerequisitos) ? cursoDoc.prerequisitos : [];
    for (const p of prereqs) {
      const tipo = p?.tipo;
      const ref = p?.ref_id;
      if (tipo === 'Curso') {
        const reqCursoId = String(ref?._id || ref || '');
        if (!reqCursoId || !cursosAprobados.has(reqCursoId)) return false;
      } else if (tipo === 'Nivel') {
        const reqNivelId = String(ref?._id || ref || '');
        if (!reqNivelId) continue;
        const requeridos = (cursosNoElectivosPorNivel.get(reqNivelId) || []).filter(id => id !== String(cursoDoc._id));
        const todosAprobados = requeridos.every(id => cursosAprobados.has(id));
        if (!todosAprobados) return false;
      }
    }
    return true;
  }

  // Agrupar por nivel -> curso -> aulas
  const nivelesMap = new Map();
  for (const aula of aulas) {
    const curso = aula.id_curso;
    // saltar cursos ya llevados por la persona
    const cursoIdStr = String(curso?._id || '');
    if (cursoIdStr && (cursosLlevados.has(cursoIdStr) || cursosConInscripcion.has(cursoIdStr))) continue;
    // validar restricciones/prerequisitos
    if (!esAptoParaCurso(curso)) continue;
    const nivel = curso?.id_nivel;
    const nivelId = nivel?._id?.toString() || 'sin-nivel';
    if (!nivelesMap.has(nivelId)) {
      nivelesMap.set(nivelId, { nivel: nivel || null, cursos: [], _cursosMap: new Map() });
    }
    const nivelGroup = nivelesMap.get(nivelId);

    const cursoId = curso?._id?.toString() || 'sin-curso';
    if (!nivelGroup._cursosMap.has(cursoId)) {
      nivelGroup._cursosMap.set(cursoId, { curso: curso || null, aulas: [] });
      nivelGroup.cursos.push(nivelGroup._cursosMap.get(cursoId));
    }
    aula.inscritos = conteoMap.get(String(aula._id)) || 0;
    nivelGroup._cursosMap.get(cursoId).aulas.push(aula);
  }

  const niveles = Array.from(nivelesMap.values())
    .map(g => ({ nivel: g.nivel, cursos: g.cursos }))
    .sort((a, b) => {
      if (!a.nivel && !b.nivel) return 0;
      if (!a.nivel) return 1; // sin-nivel al final
      if (!b.nivel) return -1;
      const an = a.nivel.nombre_nivel || '';
      const bn = b.nivel.nombre_nivel || '';
      return an.localeCompare(bn, undefined, { numeric: true, sensitivity: 'base' });
    });
  return { cicloActual, niveles };
};
