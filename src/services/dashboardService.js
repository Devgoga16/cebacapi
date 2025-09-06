const Ciclo = require("../models/ciclo");
const AulaAlumno = require("../models/aulaalumno");
const Aula = require("../models/aula");
const Curso = require("../models/curso");
const Anuncio = require("../models/anuncio");
const Persona = require("../models/persona");
const Rol = require("../models/rol");

exports.getAlumnoDashboard = async (id_persona) => {
  // 1. Ciclo actual
  const cicloActual = await Ciclo.findOne({ actual: true });

  // 2. Cursos que está cursando el alumno en el ciclo actual
  let cursosCursando = [];
  if (cicloActual) {
    // Buscar registros de AulaAlumno para el alumno
    const aulaAlumnos = await AulaAlumno.find({
      id_alumno: id_persona,
    }).populate({
      path: "id_aula",
      match: { id_ciclo: cicloActual._id },
      populate: { path: "id_curso" },
    });
    // Filtrar los que sí tienen aula del ciclo actual
    cursosCursando = aulaAlumnos;
  }

  // 3. Anuncios para el rol alumno y fecha_caducidad >= hoy

  let hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let rol = await Rol.findOne({ nombre_rol: "Estudiante" });

  let anuncios = await Anuncio.find({
    roles: { $in: [rol._id] },
    fecha_caducidad: { $gte: hoy },
  });

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
  let hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let rol = await Rol.findOne({ nombre_rol: "Docente" });
  let anuncios = await Anuncio.find({
    roles: { $in: [rol._id] },
    fecha_caducidad: { $gte: hoy },
  });

  return {
    cicloActual,
    aulas,
    total_alumnos,
    anuncios,
  };
};
