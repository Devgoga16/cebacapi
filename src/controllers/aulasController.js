const aulasService = require('../services/aulasService');
const { sendResponse } = require('../utils/helpers');

exports.getAllAulas = async (req, res, next) => {
  try {
    const aulas = await aulasService.getAllAulas();
    sendResponse(res, { data: aulas });
  } catch (err) {
    next(err);
  }
};

exports.getAulaById = async (req, res, next) => {
  try {
    const aula = await aulasService.getAulaById(req.params.id);
    if (!aula) return sendResponse(res, { state: 'failed', data: null, message: 'Aula no encontrada', action_code: 404 });
    sendResponse(res, { data: aula });
  } catch (err) {
    next(err);
  }
};

exports.createAula = async (req, res, next) => {
  try {
    const newAula = await aulasService.createAula(req.body);
    sendResponse(res, { data: newAula, message: 'Aula creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateAula = async (req, res, next) => {
  try {
    const updatedAula = await aulasService.updateAula(req.params.id, req.body);
    if (!updatedAula) return sendResponse(res, { state: 'failed', data: null, message: 'Aula no encontrada', action_code: 404 });
    sendResponse(res, { data: updatedAula, message: 'Aula actualizada' });
  } catch (err) {
    next(err);
  }
};

exports.deleteAula = async (req, res, next) => {
  try {
    const deleted = await aulasService.deleteAula(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Aula no encontrada', action_code: 404 });
    sendResponse(res, { data: null, message: 'Aula eliminada' });
  } catch (err) {
    next(err);
  }
};

exports.getListasPorAula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await aulasService.getListasPorAula(id);
    sendResponse(res, { data, message: 'Listas obtenidas' });
  } catch (err) {
    next(err);
  }
};

exports.getAulasByCursoAndCiclo = async (req, res, next) => {
  try {
    const { id_curso, id_ciclo } = req.params;
    const aulas = await aulasService.getAulasByCursoAndCiclo(id_curso, id_ciclo);
    sendResponse(res, { data: aulas });
  } catch (err) {
    next(err);
  }
};

exports.getAulasDocenteAgrupadasPorCiclo = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const grupos = await aulasService.getAulasPorProfesorAgrupadasPorCiclo(id_persona);
    sendResponse(res, { data: grupos });
  } catch (err) {
    next(err);
  }
};

exports.iniciarAula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aula = await aulasService.iniciarAula(id);
    sendResponse(res, { data: aula, message: 'Aula iniciada' });
  } catch (err) {
    next(err);
  }
};

exports.getDocenteResumenAula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fecha } = req.query;
    const data = await aulasService.getDocenteResumenAula(id, fecha);
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

exports.getAdminResumenAsistenciaAula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query || {};
    const data = await aulasService.getAdminResumenAsistenciaAula(id, { desde, hasta });
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};
