const cursosService = require('../services/cursosService');
const { sendResponse } = require('../utils/helpers');

exports.getAllCursos = async (req, res, next) => {
  try {
    const cursos = await cursosService.getAllCursos();
    sendResponse(res, { data: cursos });
  } catch (err) {
    next(err);
  }
};

exports.getCursoById = async (req, res, next) => {
  try {
    const curso = await cursosService.getCursoById(req.params.id);
    if (!curso) return sendResponse(res, { state: 'failed', data: null, message: 'Curso no encontrado', action_code: 404 });
    sendResponse(res, { data: curso });
  } catch (err) {
    next(err);
  }
};

exports.createCurso = async (req, res, next) => {
  try {
    const newCurso = await cursosService.createCurso(req.body);
    sendResponse(res, { data: newCurso, message: 'Curso creado', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateCurso = async (req, res, next) => {
  try {
    const updatedCurso = await cursosService.updateCurso(req.params.id, req.body);
    if (!updatedCurso) return sendResponse(res, { state: 'failed', data: null, message: 'Curso no encontrado', action_code: 404 });
    sendResponse(res, { data: updatedCurso, message: 'Curso actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCurso = async (req, res, next) => {
  try {
    const deleted = await cursosService.deleteCurso(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Curso no encontrado', action_code: 404 });
    sendResponse(res, { data: null, message: 'Curso eliminado' });
  } catch (err) {
    next(err);
  }
};
