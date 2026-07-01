const Persona = require('../models/persona');
const AulaAlumno = require('../models/aulaalumno');
const Aula = require('../models/aula');
const Curso = require('../models/curso');
const Nivel = require('../models/nivel');
const ExcelJS = require('exceljs');

const RANGOS_EDAD = [
  { key: '12-17', min: 12, max: 17 },
  { key: '18-25', min: 18, max: 25 },
  { key: '26-35', min: 26, max: 35 },
  { key: '36-50', min: 36, max: 50 },
  { key: '51-65', min: 51, max: 65 },
  { key: '66+', min: 66, max: 200 },
];

const DIMENSIONES_VALIDAS = ['iglesia', 'ministerio', 'nivel', 'curso', 'genero', 'estadoCivil', 'estadoMatricula', 'rangoEdad', 'ciclo'];
// Dimensiones que requieren cruzar con AulaAlumno/Aula/Curso para resolverse.
const DIMENSIONES_DE_MATRICULA = ['nivel', 'curso', 'estadoMatricula', 'ciclo'];

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const aunNoCumple = hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate());
  if (aunNoCumple) edad--;
  return edad;
}

function rangoDeEdad(edad) {
  if (edad == null) return null;
  const r = RANGOS_EDAD.find((r) => edad >= r.min && edad <= r.max);
  return r ? r.key : null;
}

function obtenerValores(dimension, persona, matriculas, nivelesMap) {
  switch (dimension) {
    case 'iglesia':
      return [persona.id_ministerio?.id_iglesia?.nombre_iglesia || 'Sin iglesia'];
    case 'ministerio':
      return [persona.id_ministerio?.nombre_ministerio || 'Sin ministerio'];
    case 'genero':
      return [persona.genero === 'F' ? 'Mujer' : 'Hombre'];
    case 'estadoCivil':
      return [persona.estado_civil || 'Sin dato'];
    case 'rangoEdad':
      return [rangoDeEdad(calcularEdad(persona.fecha_nacimiento)) || 'Sin dato'];
    case 'curso':
      return [...new Set((matriculas || []).map((m) => m.curso))];
    case 'nivel':
      return [...new Set((matriculas || []).map((m) => nivelesMap.get(m.nivelId) || 'Sin nivel'))];
    case 'ciclo':
      return [...new Set((matriculas || []).map((m) => m.ciclo))];
    case 'estadoMatricula':
      return [...new Set((matriculas || []).map((m) => m.estado))];
    default:
      return [];
  }
}

/**
 * Resuelve filtros sobre Persona, cruzando con AulaAlumno/Aula/Curso solo cuando
 * la consulta lo requiere (curso, nivel, ciclo, estado de matrícula). Reutilizada
 * tanto por la consulta para gráficos como por la exportación a Excel.
 */
async function obtenerPersonasFiltradas(filtros = {}, { agruparPor = null, cruzarCon = null } = {}) {
  const {
    iglesias = [],
    ministerios = [],
    niveles = [],
    cursos = [],
    idCiclo = null,
    estadosMatricula = [],
    genero = null,
    rangoEdad = null,
    estadosCivil = [],
    dias = [],
    incluirDocentes = false,
  } = filtros;

  // 1. Filtro Mongo sobre campos directos de Persona.
  const personaMatch = {};
  if (genero) personaMatch.genero = genero;
  if (estadosCivil.length) personaMatch.estado_civil = { $in: estadosCivil };
  if (ministerios.length) personaMatch.id_ministerio = { $in: ministerios };

  let personas = await Persona.find(personaMatch)
    .select('nombres apellido_paterno apellido_materno genero estado_civil fecha_nacimiento id_ministerio telefono email numero_documento')
    .populate({
      path: 'id_ministerio',
      select: 'nombre_ministerio id_iglesia',
      populate: { path: 'id_iglesia', select: 'nombre_iglesia' },
    })
    .lean();

  // 2. Filtro por iglesia (anidado, se resuelve en JS).
  if (iglesias.length) {
    const set = new Set(iglesias.map(String));
    personas = personas.filter((p) => p.id_ministerio?.id_iglesia && set.has(String(p.id_ministerio.id_iglesia._id)));
  }

  // 3. Filtro por rango de edad.
  if (rangoEdad) {
    personas = personas.filter((p) => rangoDeEdad(calcularEdad(p.fecha_nacimiento)) === rangoEdad);
  }

  // 4. Filtros/dimensiones de matrícula: requieren cruzar con AulaAlumno.
  const necesitaMatricula =
    niveles.length > 0 ||
    cursos.length > 0 ||
    !!idCiclo ||
    estadosMatricula.length > 0 ||
    dias.length > 0 ||
    incluirDocentes ||
    DIMENSIONES_DE_MATRICULA.includes(agruparPor) ||
    DIMENSIONES_DE_MATRICULA.includes(cruzarCon);

  const nivelesMap = new Map((await Nivel.find().select('nombre_nivel').lean()).map((n) => [String(n._id), n.nombre_nivel]));
  let matriculaInfoPorPersona = new Map();

  if (necesitaMatricula) {
    const aulaFilter = {};
    if (idCiclo) aulaFilter.id_ciclo = idCiclo;
    if (dias.length) aulaFilter.dia = { $in: dias };

    let cursoIds = cursos.length ? cursos.map(String) : null;
    if (niveles.length) {
      const cursosDeNivel = await Curso.find({ id_nivel: { $in: niveles } }).select('_id').lean();
      const idsDesdeNivel = cursosDeNivel.map((c) => String(c._id));
      cursoIds = cursoIds ? cursoIds.filter((id) => idsDesdeNivel.includes(id)) : idsDesdeNivel;
    }
    if (cursoIds) aulaFilter.id_curso = { $in: cursoIds };

    const aulas = await Aula.find(aulaFilter)
      .select('_id id_curso id_ciclo id_profesor')
      .populate('id_curso', 'nombre_curso id_nivel')
      .populate('id_ciclo', 'nombre_ciclo')
      .lean();
    const aulaMap = new Map(aulas.map((a) => [String(a._id), a]));
    const aulaIds = aulas.map((a) => a._id);

    const aaFilter = { id_aula: { $in: aulaIds } };
    if (estadosMatricula.length) aaFilter.estado = { $in: estadosMatricula };

    const aulaAlumnos = aulaIds.length ? await AulaAlumno.find(aaFilter).select('id_aula id_alumno estado').lean() : [];

    for (const aa of aulaAlumnos) {
      const pid = String(aa.id_alumno);
      const aula = aulaMap.get(String(aa.id_aula));
      if (!matriculaInfoPorPersona.has(pid)) matriculaInfoPorPersona.set(pid, []);
      matriculaInfoPorPersona.get(pid).push({
        curso: aula?.id_curso?.nombre_curso || 'Sin curso',
        nivelId: String(aula?.id_curso?.id_nivel || ''),
        ciclo: aula?.id_ciclo?.nombre_ciclo || 'Sin ciclo',
        estado: aa.estado,
      });
    }

    // Solo personas con al menos una matrícula que cumpla los filtros de matrícula.
    personas = personas.filter((p) => matriculaInfoPorPersona.has(String(p._id)));

    // Incluir docentes de las aulas filtradas (opcional).
    if (incluirDocentes && aulaIds.length) {
      const profesorIds = [...new Set(aulas.map((a) => String(a.id_profesor)).filter(Boolean))];
      const existingIds = new Set(personas.map((p) => String(p._id)));
      const nuevosIds = profesorIds.filter((id) => !existingIds.has(id));
      if (nuevosIds.length) {
        const profMatch = { ...personaMatch, _id: { $in: nuevosIds } };
        let profs = await Persona.find(profMatch)
          .select('nombres apellido_paterno apellido_materno genero estado_civil fecha_nacimiento id_ministerio telefono email numero_documento')
          .populate({ path: 'id_ministerio', select: 'nombre_ministerio id_iglesia', populate: { path: 'id_iglesia', select: 'nombre_iglesia' } })
          .lean();
        if (iglesias.length) {
          const igSet = new Set(iglesias.map(String));
          profs = profs.filter((p) => p.id_ministerio?.id_iglesia && igSet.has(String(p.id_ministerio.id_iglesia._id)));
        }
        if (rangoEdad) {
          profs = profs.filter((p) => rangoDeEdad(calcularEdad(p.fecha_nacimiento)) === rangoEdad);
        }
        personas = [...personas, ...profs];
      }
    }
  }

  // Orden alfabético consistente: apellido paterno, apellido materno, nombres.
  personas.sort((a, b) =>
    `${a.apellido_paterno || ''} ${a.apellido_materno || ''} ${a.nombres || ''}`.localeCompare(
      `${b.apellido_paterno || ''} ${b.apellido_materno || ''} ${b.nombres || ''}`,
      'es',
      { sensitivity: 'base' },
    ),
  );

  return { personas, matriculaInfoPorPersona, nivelesMap };
}

/**
 * Resuelve filtros + agrupación sobre Persona para los gráficos de analítica.
 * Todo el cálculo de breakdown se hace en memoria sobre el conjunto ya filtrado,
 * ya que el volumen de personas es bajo (cientos/miles, no millones).
 */
exports.query = async ({ filtros = {}, agruparPor = null, cruzarCon = null, incluirDetalle = false }) => {
  if (agruparPor && !DIMENSIONES_VALIDAS.includes(agruparPor)) {
    const err = new Error(`Dimensión "agruparPor" inválida: ${agruparPor}`);
    err.statusCode = 400;
    throw err;
  }
  if (cruzarCon && !DIMENSIONES_VALIDAS.includes(cruzarCon)) {
    const err = new Error(`Dimensión "cruzarCon" inválida: ${cruzarCon}`);
    err.statusCode = 400;
    throw err;
  }

  const { personas, matriculaInfoPorPersona, nivelesMap } = await obtenerPersonasFiltradas(filtros, { agruparPor, cruzarCon });
  const total = personas.length;

  // 5. Breakdown según agruparPor (+ cruzarCon opcional).
  const breakdownMap = new Map();
  if (agruparPor) {
    for (const p of personas) {
      const matriculas = matriculaInfoPorPersona.get(String(p._id)) || [];
      const vals1 = obtenerValores(agruparPor, p, matriculas, nivelesMap);
      const vals2 = cruzarCon ? obtenerValores(cruzarCon, p, matriculas, nivelesMap) : [null];
      const v1List = vals1.length ? vals1 : ['Sin dato'];
      const v2List = vals2.length ? vals2 : ['Sin dato'];
      for (const v1 of v1List) {
        for (const v2 of v2List) {
          const key = `${v1}||${v2 ?? ''}`;
          breakdownMap.set(key, (breakdownMap.get(key) || 0) + 1);
        }
      }
    }
  }

  const breakdown = Array.from(breakdownMap.entries())
    .map(([key, total]) => {
      const [dim1, dim2] = key.split('||');
      return cruzarCon ? { dim1, dim2, total } : { dim1, total };
    })
    .sort((a, b) => b.total - a.total);

  // 6. Detalle (lista de personas), tope defensivo para no mandar payloads gigantes.
  let detalle;
  if (incluirDetalle) {
    const LIMITE_DETALLE = 500;
    detalle = personas.slice(0, LIMITE_DETALLE).map((p) => {
      const matriculas = matriculaInfoPorPersona.get(String(p._id)) || [];
      return {
        id: p._id,
        nombre: `${p.apellido_paterno || ''} ${p.apellido_materno || ''} ${p.nombres || ''}`.trim(),
        genero: p.genero === 'F' ? 'Mujer' : 'Hombre',
        estadoCivil: p.estado_civil || null,
        edad: calcularEdad(p.fecha_nacimiento),
        iglesia: p.id_ministerio?.id_iglesia?.nombre_iglesia || null,
        ministerio: p.id_ministerio?.nombre_ministerio || null,
        cursos: [...new Set(matriculas.map((m) => m.curso))],
        estadosMatricula: [...new Set(matriculas.map((m) => m.estado))],
      };
    });
  }

  return { total, breakdown, detalle, truncado: incluirDetalle ? personas.length > 500 : false };
};

/**
 * Genera un Excel con el listado completo de personas que cumplen los filtros
 * (sin el tope de 500 que aplica la consulta para gráficos), para que el admin
 * pueda descargar y contactar/trabajar con esa lista fuera del sistema.
 */
exports.exportarExcel = async (filtros = {}) => {
  const { personas, matriculaInfoPorPersona } = await obtenerPersonasFiltradas(filtros, {});

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CEBAC Sistema';
  const ws = workbook.addWorksheet('Personas filtradas');

  const headers = [
    'Apellido Paterno', 'Apellido Materno', 'Nombres', 'Documento', 'Teléfono', 'Email',
    'Género', 'Edad', 'Estado Civil', 'Iglesia', 'Ministerio', 'Cursos', 'Estado(s) de matrícula',
  ];
  ws.addRow(headers);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A6E' } };
  });

  for (const p of personas) {
    const matriculas = matriculaInfoPorPersona.get(String(p._id)) || [];
    ws.addRow([
      p.apellido_paterno || '',
      p.apellido_materno || '',
      p.nombres || '',
      p.numero_documento || '',
      p.telefono || '',
      p.email || '',
      p.genero === 'F' ? 'Mujer' : 'Hombre',
      calcularEdad(p.fecha_nacimiento) ?? '',
      p.estado_civil || '',
      p.id_ministerio?.id_iglesia?.nombre_iglesia || '',
      p.id_ministerio?.nombre_ministerio || '',
      [...new Set(matriculas.map((m) => m.curso))].join(', '),
      [...new Set(matriculas.map((m) => m.estado))].join(', '),
    ]);
  }

  ws.columns.forEach((col, i) => {
    col.width = [16, 16, 18, 14, 13, 24, 9, 7, 12, 24, 22, 28, 20][i] || 16;
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

  return { workbook, total: personas.length };
};
