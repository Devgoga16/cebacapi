const EvaluacionDocente = require('../models/evaluacionDocente');
const Aula = require('../models/aula');
const mongoose = require('mongoose');

exports.crear = async (data) => {
  const evaluacion = new EvaluacionDocente(data);
  return await evaluacion.save();
};

exports.yaEvaluo = async (idAula, idAlumno) => {
  const existe = await EvaluacionDocente.findOne({ id_aula: idAula, id_alumno: idAlumno });
  return !!existe;
};

exports.getByAula = async (idAula) => {
  return await EvaluacionDocente.find({ id_aula: idAula })
    .select('-id_alumno')
    .sort({ createdAt: -1 });
};

exports.resumenDocente = async (idProfesor) => {
  const aulas = await Aula.find({ id_profesor: new mongoose.Types.ObjectId(idProfesor) }).select('_id');
  const aulaIds = aulas.map(a => a._id);
  if (aulaIds.length === 0) return { total_evaluaciones: 0, promedios: [], comentarios: [] };

  const [promedios, comentarios, totalArr] = await Promise.all([
    EvaluacionDocente.aggregate([
      { $match: { id_aula: { $in: aulaIds } } },
      { $unwind: '$calificaciones' },
      { $group: {
        _id: { id_grupo: '$calificaciones.id_grupo', criterio: '$calificaciones.criterio' },
        promedio: { $avg: '$calificaciones.puntuacion' },
        total: { $sum: 1 },
      }},
      { $sort: { '_id.criterio': 1 } },
    ]),
    EvaluacionDocente.find({ id_aula: { $in: aulaIds }, comentario: { $ne: '' } })
      .select('comentario id_aula createdAt -_id')
      .sort({ createdAt: -1 })
      .limit(50),
    EvaluacionDocente.countDocuments({ id_aula: { $in: aulaIds } }),
  ]);

  return { total_evaluaciones: totalArr, promedios, comentarios };
};

exports.pendientesAlumno = async (idAlumno) => {
  const AulaAlumno = require('../models/aulaalumno');
  const Aula = require('../models/aula');

  const matriculas = await AulaAlumno.find({ id_alumno: idAlumno })
    .populate({
      path: 'id_aula',
      match: { estado: 'terminada' },
      select: '_id id_curso',
      populate: { path: 'id_curso', select: 'nombre_curso' },
    });

  const aulasTerminadas = matriculas.filter(m => m.id_aula);

  const evaluadas = await EvaluacionDocente.find({
    id_alumno: idAlumno,
    id_aula: { $in: aulasTerminadas.map(m => m.id_aula._id) },
  }).select('id_aula');
  const evaluadasSet = new Set(evaluadas.map(e => e.id_aula.toString()));

  return aulasTerminadas
    .filter(m => !evaluadasSet.has(m.id_aula._id.toString()))
    .map(m => ({
      aulaId: m.id_aula._id,
      nombre_curso: m.id_aula.id_curso?.nombre_curso || 'Curso',
    }));
};

exports.resumenDocentePorAula = async (idProfesor, idAula) => {
  const aula = await Aula.findOne({ _id: idAula, id_profesor: new mongoose.Types.ObjectId(idProfesor) });
  if (!aula) return null;

  const [promedios, comentarios, total] = await Promise.all([
    EvaluacionDocente.aggregate([
      { $match: { id_aula: new mongoose.Types.ObjectId(idAula) } },
      { $unwind: '$calificaciones' },
      { $group: {
        _id: { id_grupo: '$calificaciones.id_grupo', criterio: '$calificaciones.criterio' },
        promedio: { $avg: '$calificaciones.puntuacion' },
        total: { $sum: 1 },
      }},
      { $sort: { '_id.criterio': 1 } },
    ]),
    EvaluacionDocente.find({ id_aula: new mongoose.Types.ObjectId(idAula), comentario: { $ne: '' } })
      .select('comentario createdAt -_id')
      .sort({ createdAt: -1 }),
    EvaluacionDocente.countDocuments({ id_aula: new mongoose.Types.ObjectId(idAula) }),
  ]);

  return { total_evaluaciones: total, promedios, comentarios };
};
