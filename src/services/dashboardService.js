const Ciclo = require("../models/ciclo");
const AulaAlumno = require("../models/aulaalumno");
const Aula = require("../models/aula");
const Curso = require("../models/curso");
const Anuncio = require("../models/anuncio");
const Persona = require("../models/persona");
const Rol = require("../models/rol");
const Asistencia = require("../models/asistencia");
const Inscripcion = require("../models/inscripcion");

const DIAS_SEMANA_POR_INDICE_UTC = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

exports.getAlumnoDashboard = async (id_persona) => {
  // 1. Ciclo actual
  const cicloActual = await Ciclo.findOne({ actual: true });

  // 2. Cursos que está cursando el alumno en el ciclo actual
  let cursosCursando = [];
  if (cicloActual) {
    // Obtener aulas del ciclo actual y filtrar por esos IDs para evitar traer otros ciclos
    const aulasIds = (await Aula.find({ id_ciclo: cicloActual._id }).select('_id').lean()).map(a => a._id);
    const aulaAlumnos = aulasIds.length
      ? await AulaAlumno.find({ id_alumno: id_persona, id_aula: { $in: aulasIds } })
          .populate({
            path: 'id_aula',
            populate: [
              { path: 'id_curso' },
              { path: 'id_profesor', select: '-imagen' }
            ]
          })
      : [];
    cursosCursando = aulaAlumnos;
  }

  // 3. Anuncios para el rol alumno y fecha_caducidad >= hoy

  // Usar inicio del día en UTC para evitar problemas de zona horaria cuando
  // fecha_caducidad se guarda como fecha (00:00:00Z). Esto garantiza que
  // un anuncio con caducidad "hoy" sea visible hasta las 23:59:59 hora local.
  const now = new Date();
  // Construye medianoche UTC de la FECHA LOCAL actual
  // (usa getFullYear()/getMonth()/getDate() en lugar de getUTC* para no saltar de día)
  const hoyUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));


  let rol = await Rol.findOne({ nombre_rol: "estudiante" });

  let anuncios = await Anuncio.find({
    roles: { $in: [rol._id] },
    fecha_caducidad: { $gte: hoyUTC },
  }).populate('id_categoria_anuncio roles id_publicador');

  return {
    cicloActual,
    cursosCursando,
    anuncios,
  };
};

exports.getDocenteDashboard = async (id_persona) => {
  // 1. Ciclo actual
  const cicloActual = await Ciclo.findOne({ actual: true });

  // 2. Aulas del ciclo actual por profesor (directo en Aula)
  let aulas = [];
  let total_alumnos = 0;
  if (cicloActual) {
    const aulasDocs = await Aula.find({ id_profesor: id_persona, id_ciclo: cicloActual._id })
      .populate({
        path: 'id_curso',
        populate: { path: 'id_nivel' }
      });
    // Sumar registros de AulaAlumno agrupados por id_aula
    const aulaIds = aulasDocs.map(a => a._id);
    total_alumnos = await AulaAlumno.countDocuments({ id_aula: { $in: aulaIds } });
    // Para cada aula, agregar campo alumnos con el conteo de AulaAlumno
    aulas = await Promise.all(aulasDocs.map(async (aulaDoc) => {
      const aulaObj = aulaDoc.toObject();
      aulaObj.alumnos = await AulaAlumno.countDocuments({ id_aula: aulaObj._id });
      return aulaObj;
    }));
  }

  // 3. Anuncios para el rol docente y fecha_caducidad >= hoy
  const now = new Date();
  const hoyUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  let rol = await Rol.findOne({ nombre_rol: "docente" });
  let anuncios = await Anuncio.find({
    roles: { $in: [rol._id] },
    fecha_caducidad: { $gte: hoyUTC },
  }).populate('id_categoria_anuncio roles id_publicador');

  return {
    cicloActual,
    aulas,
    total_alumnos,
    anuncios,
  };
};

exports.getAdminDashboard = async (id_persona) => {
  // 1. Ciclo actual
  const cicloActual = await Ciclo.findOne({ actual: true });

  // 2. Conteo de usuarios (total de personas)
  const totalUsuarios = await Persona.countDocuments();

  // 3. Conteo de alumnos (personas con rol estudiante)
  const rolEstudiante = await Rol.findOne({ nombre_rol: "estudiante" });
  const totalAlumnos = rolEstudiante 
    ? await Persona.countDocuments({ 
        id_user: { 
          $in: await require('../models/usuario').find({ roles: rolEstudiante._id }).distinct('_id')
        }
      })
    : 0;

  // 4. Conteo de profesores (personas con rol docente)
  const rolDocente = await Rol.findOne({ nombre_rol: "docente" });
  const totalProfesores = rolDocente
    ? await Persona.countDocuments({ 
        id_user: { 
          $in: await require('../models/usuario').find({ roles: rolDocente._id }).distinct('_id')
        }
      })
    : 0;

  // 5. Conteo de aulas
  const totalAulas = await Aula.countDocuments();

  // 3. Anuncios para el rol docente y fecha_caducidad >= hoy
  const now = new Date();
  const hoyUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  let rol = await Rol.findOne({ nombre_rol: "admin" });
  let anuncios = await Anuncio.find({
    roles: { $in: [rol._id] },
    fecha_caducidad: { $gte: hoyUTC },
  }).populate('id_categoria_anuncio roles id_publicador');

  return {
    cicloActual,
    totalUsuarios,
    totalAlumnos,
    totalProfesores,
    totalAulas,
    anuncios
  };
};

/**
 * Resumen de gestión del ciclo actual para el panel de Administración:
 * matrículas vs. alumnos únicos, asistencia, aprobación, aulas sin tomar
 * asistencia hoy, inscripciones pendientes y avance de la campaña de
 * actualización de datos. Pensado para dar al admin una vista accionable,
 * no solo conteos.
 */
exports.getAdminCicloResumen = async () => {
  const ciclo = await Ciclo.findOne({ actual: true }).lean();
  if (!ciclo) {
    return { ciclo: null };
  }

  const aulas = await Aula.find({ id_ciclo: ciclo._id })
    .populate('id_curso', 'nombre_curso')
    .populate('id_profesor', 'nombres apellido_paterno apellido_materno')
    .lean();
  const aulaIds = aulas.map((a) => a._id);

  // ── Aulas por estado ──────────────────────────────────────────────
  const aulasPorEstado = { creada: 0, iniciada: 0, terminada: 0 };
  for (const a of aulas) {
    if (Object.prototype.hasOwnProperty.call(aulasPorEstado, a.estado)) {
      aulasPorEstado[a.estado]++;
    }
  }

  // ── Matrículas vs. alumnos únicos (cada AulaAlumno = una matrícula) ─
  const aulaAlumnos = aulaIds.length
    ? await AulaAlumno.find({ id_aula: { $in: aulaIds } }).select('id_aula id_alumno estado').lean()
    : [];

  const cursosPorAlumno = new Map();
  for (const aa of aulaAlumnos) {
    const idAlumno = aa.id_alumno?.toString();
    if (!idAlumno) continue;
    if (!cursosPorAlumno.has(idAlumno)) cursosPorAlumno.set(idAlumno, 0);
    cursosPorAlumno.set(idAlumno, cursosPorAlumno.get(idAlumno) + 1);
  }
  const totalAlumnosUnicos = cursosPorAlumno.size;
  const totalMatriculas = aulaAlumnos.length;
  const alumnosConMasDeUnCurso = Array.from(cursosPorAlumno.values()).filter((n) => n > 1).length;

  // ── Perfil del alumnado: iglesia de procedencia y edad/género ───────
  const idsAlumnosUnicos = Array.from(cursosPorAlumno.keys());
  const alumnosPerfil = idsAlumnosUnicos.length
    ? await Persona.find({ _id: { $in: idsAlumnosUnicos } })
        .select('genero fecha_nacimiento id_ministerio')
        .populate({ path: 'id_ministerio', select: 'id_iglesia', populate: { path: 'id_iglesia', select: 'nombre_iglesia' } })
        .lean()
    : [];

  const porIglesiaMap = new Map();
  for (const p of alumnosPerfil) {
    const nombreIglesia = p.id_ministerio?.id_iglesia?.nombre_iglesia || 'Sin iglesia registrada';
    porIglesiaMap.set(nombreIglesia, (porIglesiaMap.get(nombreIglesia) || 0) + 1);
  }
  const distribucionIglesia = Array.from(porIglesiaMap.entries())
    .map(([iglesia, total]) => ({ iglesia, total }))
    .sort((a, b) => b.total - a.total);

  const RANGOS_EDAD = [
    { rango: '12-17', min: 12, max: 17 },
    { rango: '18-25', min: 18, max: 25 },
    { rango: '26-35', min: 26, max: 35 },
    { rango: '36-50', min: 36, max: 50 },
    { rango: '51-65', min: 51, max: 65 },
    { rango: '66+', min: 66, max: 200 },
  ];
  const piramideEdad = RANGOS_EDAD.map((r) => ({ rango: r.rango, M: 0, F: 0 }));
  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const aunNoCumple = hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate());
    if (aunNoCumple) edad--;
    return edad;
  };
  for (const p of alumnosPerfil) {
    const edad = calcularEdad(p.fecha_nacimiento);
    if (edad == null) continue;
    const bucket = piramideEdad.find((r, i) => edad >= RANGOS_EDAD[i].min && edad <= RANGOS_EDAD[i].max);
    if (!bucket) continue;
    if (p.genero === 'F') bucket.F++;
    else bucket.M++;
  }

  const estadosCount = { aprobado: 0, reprobado: 0, 'en curso': 0, retirado: 0 };
  for (const aa of aulaAlumnos) {
    if (Object.prototype.hasOwnProperty.call(estadosCount, aa.estado)) {
      estadosCount[aa.estado]++;
    }
  }
  const matriculasConResultado = estadosCount.aprobado + estadosCount.reprobado;
  const porcentajeAprobacion = matriculasConResultado > 0
    ? Number(((estadosCount.aprobado / matriculasConResultado) * 100).toFixed(1))
    : null;

  // ── Asistencia global del ciclo ─────────────────────────────────────
  const asistencias = aulaIds.length
    ? await Asistencia.find({ id_aula: { $in: aulaIds } }).select('estado').lean()
    : [];
  const asistenciaPorEstado = { presente: 0, ausente: 0, tarde: 0, justificado: 0 };
  for (const reg of asistencias) {
    if (Object.prototype.hasOwnProperty.call(asistenciaPorEstado, reg.estado)) {
      asistenciaPorEstado[reg.estado]++;
    }
  }
  const porcentajeAsistencia = asistencias.length > 0
    ? Number((((asistenciaPorEstado.presente + asistenciaPorEstado.tarde) / asistencias.length) * 100).toFixed(1))
    : null;

  // ── Aulas que debían tomar asistencia hoy y no lo hicieron ──────────
  const now = new Date();
  const hoyUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const nombreDiaHoy = DIAS_SEMANA_POR_INDICE_UTC[hoyUTC.getUTCDay()];

  const aulasHoy = aulas.filter((a) => a.dia === nombreDiaHoy && a.estado !== 'terminada');
  const aulasHoyIds = aulasHoy.map((a) => a._id);
  const aulasConAsistenciaHoy = aulasHoyIds.length
    ? new Set(
        (await Asistencia.find({ id_aula: { $in: aulasHoyIds }, fecha: hoyUTC }).select('id_aula').lean())
          .map((r) => r.id_aula.toString())
      )
    : new Set();

  const aulasSinAsistenciaHoy = aulasHoy
    .filter((a) => !aulasConAsistenciaHoy.has(a._id.toString()))
    .map((a) => ({
      id_aula: a._id,
      curso: a.id_curso?.nombre_curso || 'Sin curso',
      profesor: a.id_profesor
        ? `${a.id_profesor.apellido_paterno || ''} ${a.id_profesor.apellido_materno || ''} ${a.id_profesor.nombres || ''}`.trim()
        : 'Sin asignar',
      hora_inicio: a.hora_inicio,
      hora_fin: a.hora_fin,
    }));

  // ── Aulas con asistencia más baja (alerta temprana) ────────────────
  const asistenciaPorAula = new Map();
  if (aulaIds.length) {
    const regsConAula = await Asistencia.find({ id_aula: { $in: aulaIds } }).select('id_aula estado').lean();
    for (const r of regsConAula) {
      const key = r.id_aula.toString();
      if (!asistenciaPorAula.has(key)) asistenciaPorAula.set(key, { total: 0, presentes: 0 });
      const entry = asistenciaPorAula.get(key);
      entry.total++;
      if (r.estado === 'presente' || r.estado === 'tarde') entry.presentes++;
    }
  }
  const aulaPorId = new Map(aulas.map((a) => [a._id.toString(), a]));
  const aulasBajaAsistencia = Array.from(asistenciaPorAula.entries())
    .filter(([, v]) => v.total >= 3) // evita alertar con muy pocos registros
    .map(([id, v]) => {
      const a = aulaPorId.get(id);
      return {
        id_aula: id,
        curso: a?.id_curso?.nombre_curso || 'Sin curso',
        dia: a?.dia,
        porcentaje: Number(((v.presentes / v.total) * 100).toFixed(1)),
      };
    })
    .filter((a) => a.porcentaje < 70)
    .sort((a, b) => a.porcentaje - b.porcentaje)
    .slice(0, 5);

  // ── Inscripciones pendientes de revisión ────────────────────────────
  const inscripcionesPendientes = await Inscripcion.countDocuments({
    id_aula: { $in: aulaIds },
    estado: 'Pendiente',
  });

  // ── Avance de la campaña de actualización de datos (datos_actualizados) ─
  const totalPersonas = await Persona.countDocuments();
  const personasActualizadas = await Persona.countDocuments({ datos_actualizados: true });
  const porcentajeCampaniaDatos = totalPersonas > 0
    ? Number(((personasActualizadas / totalPersonas) * 100).toFixed(1))
    : 0;

  // ── Alertas accionables, en orden de prioridad ──────────────────────
  const alertas = [];
  if (aulasSinAsistenciaHoy.length > 0) {
    alertas.push({
      tipo: 'asistencia',
      severidad: 'alta',
      mensaje: `${aulasSinAsistenciaHoy.length} aula(s) con clase hoy (${nombreDiaHoy}) aún no registraron asistencia`,
    });
  }
  if (inscripcionesPendientes > 0) {
    alertas.push({
      tipo: 'inscripciones',
      severidad: 'media',
      mensaje: `${inscripcionesPendientes} inscripción(es) pendiente(s) de revisión`,
    });
  }
  if (aulasBajaAsistencia.length > 0) {
    alertas.push({
      tipo: 'asistencia_baja',
      severidad: 'media',
      mensaje: `${aulasBajaAsistencia.length} aula(s) con asistencia por debajo del 70%`,
    });
  }
  if (totalPersonas > 0 && porcentajeCampaniaDatos < 100) {
    alertas.push({
      tipo: 'datos_personales',
      severidad: 'baja',
      mensaje: `${totalPersonas - personasActualizadas} usuario(s) aún no completan la actualización de datos`,
    });
  }

  return {
    ciclo: {
      _id: ciclo._id,
      nombre_ciclo: ciclo.nombre_ciclo,
      año: ciclo.año,
      fecha_inicio: ciclo.fecha_inicio,
      fecha_fin: ciclo.fecha_fin,
    },
    aulas: {
      total: aulas.length,
      porEstado: aulasPorEstado,
    },
    matriculas: {
      totalMatriculas,
      totalAlumnosUnicos,
      alumnosConMasDeUnCurso,
      estadosCount,
      porcentajeAprobacion,
    },
    perfilAlumnado: {
      distribucionIglesia,
      piramideEdad,
    },
    asistencia: {
      totalRegistros: asistencias.length,
      porEstado: asistenciaPorEstado,
      porcentajeAsistencia,
      aulasSinAsistenciaHoy,
      aulasBajaAsistencia,
    },
    inscripciones: {
      pendientes: inscripcionesPendientes,
    },
    campaniaDatos: {
      total: totalPersonas,
      completados: personasActualizadas,
      porcentaje: porcentajeCampaniaDatos,
    },
    alertas,
  };
};
