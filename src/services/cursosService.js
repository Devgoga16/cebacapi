const Curso = require('../models/curso');
const Aula = require('../models/aula');
const AulaAlumno = require('../models/aulaalumno');

exports.getAllCursos = async () => {
  return await Curso.find()
    .populate('id_nivel')
    .populate('prerequisitos.ref_id');
};

exports.getCursoById = async (id) => {
  return await Curso.findById(id)
    .populate('id_nivel')
    .populate('prerequisitos.ref_id');
};

exports.createCurso = async (data) => {
  const curso = new Curso(data);
  return await curso.save(); 
};

exports.updateCurso = async (id, data) => {
  return await Curso.findByIdAndUpdate(id, data, { new: true })
    .populate('id_nivel')
    .populate('prerequisitos.ref_id');
};

exports.deleteCurso = async (id) => {
  const result = await Curso.findByIdAndDelete(id);
  return !!result;
};

// Devuelve la malla curricular para un alumno: lista de cursos y, por cada curso,
// los registros en AulaAlumno que correspondan al id_persona (id_alumno) y a aulas de ese curso
exports.getMallaCurricularPorPersona = async (id_persona, options = {}) => {
  const { groupBy } = options || {};
  // 1) Traer todos los cursos con sus referencias usuales
  const cursos = await Curso.find()
    .populate('id_nivel')
    .populate('prerequisitos.ref_id');

  if (!cursos || cursos.length === 0) return [];

  // 2) Traer todas las aulas de esos cursos para relacionar AulaAlumno
  const cursoIds = cursos.map(c => c._id);
  const aulas = await Aula.find({ id_curso: { $in: cursoIds } })
    .select('_id id_curso');

  // Opcional: log de depuración que existía antes
  console.log('aulassssss', aulas);

  const allAulaIds = aulas.map(a => a._id);

  // 3) Traer AulaAlumno del alumno para esas aulas
  let aulaAlumnos = [];
  if (allAulaIds.length > 0) {
    aulaAlumnos = await AulaAlumno.find({ id_aula: { $in: allAulaIds }, id_alumno: id_persona })
      .populate({
        path: 'id_aula',
        populate: [
          { path: 'id_curso' },
          { path: 'id_ciclo' },
          { path: 'id_profesor', select: 'nombres apellido_paterno apellido_materno' }
        ]
      })
      .populate({
        path: 'id_alumno',
        populate: [
          { path: 'id_user', select: 'active validado' },
          { path: 'id_ministerio', populate: { path: 'id_iglesia' } }
        ]
      });
  }

  // 3.1) Preparar set de cursos aprobados por el alumno
  const aprobadasSet = new Set(
    aulaAlumnos
      .filter(r => String(r?.estado || '').toLowerCase() === 'aprobado')
      .map(r => String(r?.id_aula?.id_curso?._id || r?.id_aula?.id_curso))
      .filter(Boolean)
  );

  // 3.2) Índice de cursos no electivos por nivel (para validar prerequisitos de tipo Nivel)
  const cursosNoElectivosPorNivel = new Map();
  for (const c of cursos) {
    const nivelId = c?.id_nivel ? String(c.id_nivel._id || c.id_nivel) : null;
    if (!nivelId) continue;
    if (!cursosNoElectivosPorNivel.has(nivelId)) cursosNoElectivosPorNivel.set(nivelId, []);
    if (c.electivo !== true) {
      cursosNoElectivosPorNivel.get(nivelId).push(String(c._id));
    }
  }

  // 3.3) Evaluar aptitud del alumno para cada curso según prerequisitos
  function evaluarAptitud(curso) {
    const faltantesCursos = [];
    const faltantesNivel = [];
    let okCursos = true;
    let okNivel = true;

    const prereqs = Array.isArray(curso.prerequisitos) ? curso.prerequisitos : [];
    for (const p of prereqs) {
      const tipo = p?.tipo;
      const ref = p?.ref_id;
      if (tipo === 'Curso') {
        const reqCursoId = String(ref?._id || ref || '');
        if (!reqCursoId || !aprobadasSet.has(reqCursoId)) {
          okCursos = false;
          faltantesCursos.push(reqCursoId || null);
        }
      } else if (tipo === 'Nivel') {
        const reqNivelId = String(ref?._id || ref || '');
        if (reqNivelId) {
          const requeridos = (cursosNoElectivosPorNivel.get(reqNivelId) || []).filter(id => id !== String(curso._id));
          const faltan = requeridos.filter(id => !aprobadasSet.has(id));
          if (faltan.length > 0) {
            okNivel = false;
            faltantesNivel.push({ nivel: reqNivelId, cursos: faltan });
          }
        }
      }
    }

    return { apto: okCursos && okNivel, faltantes: { cursos: faltantesCursos, niveles: faltantesNivel } };
  }

  // 4) Agrupar AulaAlumno por curso (vía id_aula.id_curso)
  const registrosByCurso = new Map();
  for (const reg of aulaAlumnos) {
    const cursoId = reg?.id_aula?.id_curso?._id || reg?.id_aula?.id_curso; // soporta ObjectId plano
    if (!cursoId) continue;
    const key = String(cursoId);
    if (!registrosByCurso.has(key)) registrosByCurso.set(key, []);
    registrosByCurso.get(key).push(reg);
  }

  // 5) Construir respuesta: curso + registros del alumno + flag tiene_registros
  const porCurso = cursos.map(curso => {
    const key = String(curso._id);
    const registros = registrosByCurso.get(key) || [];
    const { apto, faltantes } = evaluarAptitud(curso);
    return {
      curso,
      registros,
      total_registros: registros.length,
      tiene_registros: registros.length > 0,
      apto,
      requisitos: faltantes,
    };
  });

  if (groupBy === 'nivel') {
    // Agrupar por curso.id_nivel
    const grupos = new Map();
    for (const item of porCurso) {
      const nivel = item.curso?.id_nivel || null;
      const nivelKey = nivel ? String(nivel._id || nivel) : 'sin_nivel';
      if (!grupos.has(nivelKey)) grupos.set(nivelKey, { nivel, cursos: [], total_registros: 0, cursos_con_registros: 0 });
      const g = grupos.get(nivelKey);
      g.cursos.push(item);
      g.total_registros += item.total_registros;
      if (item.tiene_registros) g.cursos_con_registros += 1;
    }
    return Array.from(grupos.values());
  }

  return porCurso;
};
