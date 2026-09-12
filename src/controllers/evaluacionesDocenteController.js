const service = require('../services/evaluacionesDocenteService');
const Aula = require('../models/aula');
const AulaAlumno = require('../models/aulaalumno');

exports.crear = async (req, res, next) => {
  try {
    const { id_aula, calificaciones, comentario } = req.body;
    const id_alumno = req.usuarioToken?.id_persona;
    if (!id_alumno) return res.status(400).json({ state: 'failed', data: null, message: 'No se pudo identificar al alumno', action_code: 400 });

    const aula = await Aula.findById(id_aula);
    if (!aula) return res.status(404).json({ state: 'failed', data: null, message: 'Aula no encontrada', action_code: 404 });
    if (aula.estado !== 'terminada') return res.status(400).json({ state: 'failed', data: null, message: 'El aula aún no ha terminado', action_code: 400 });

    const matricula = await AulaAlumno.findOne({ id_aula, id_alumno });
    if (!matricula) return res.status(403).json({ state: 'failed', data: null, message: 'No estás matriculado en esta aula', action_code: 403 });

    const yaEvaluo = await service.yaEvaluo(id_aula, id_alumno);
    if (yaEvaluo) return res.status(409).json({ state: 'failed', data: null, message: 'Ya evaluaste esta aula', action_code: 409 });

    const evaluacion = await service.crear({ id_aula, id_alumno, calificaciones, comentario });
    res.status(201).json({ state: 'success', data: { _id: evaluacion._id }, message: 'Evaluación registrada', action_code: 201 });
  } catch (err) { next(err); }
};

exports.yaEvaluo = async (req, res, next) => {
  try {
    const id_alumno = req.usuarioToken?.id_persona;
    if (!id_alumno) return res.status(400).json({ state: 'failed', data: null, message: 'No se pudo identificar al alumno', action_code: 400 });
    const result = await service.yaEvaluo(req.params.idAula, id_alumno);
    res.json({ state: 'success', data: { ya_evaluo: result }, message: null, action_code: 200 });
  } catch (err) { next(err); }
};

exports.getByAula = async (req, res, next) => {
  try {
    const evaluaciones = await service.getByAula(req.params.idAula);
    res.json({ state: 'success', data: evaluaciones, message: 'Evaluaciones obtenidas', action_code: null });
  } catch (err) { next(err); }
};

exports.pendientes = async (req, res, next) => {
  try {
    const id_alumno = req.usuarioToken?.id_persona;
    if (!id_alumno) return res.status(400).json({ state: 'failed', data: null, message: 'No se pudo identificar al alumno', action_code: 400 });
    const pendientes = await service.pendientesAlumno(id_alumno);
    res.json({ state: 'success', data: pendientes, message: null, action_code: 200 });
  } catch (err) { next(err); }
};

exports.resumenDocente = async (req, res, next) => {
  try {
    const resumen = await service.resumenDocente(req.params.idProfesor);
    res.json({ state: 'success', data: resumen, message: 'Resumen obtenido', action_code: null });
  } catch (err) { next(err); }
};

exports.resumenDocentePorAula = async (req, res, next) => {
  try {
    const resumen = await service.resumenDocentePorAula(req.params.idProfesor, req.params.idAula);
    if (!resumen) return res.status(404).json({ state: 'failed', data: null, message: 'Aula no encontrada para este docente', action_code: 404 });
    res.json({ state: 'success', data: resumen, message: 'Resumen por aula obtenido', action_code: null });
  } catch (err) { next(err); }
};
