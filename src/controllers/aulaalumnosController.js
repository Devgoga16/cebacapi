const aulaalumnosService = require('../services/aulaalumnosService');
const { sendResponse } = require('../utils/helpers');

exports.getAllAulaAlumnos = async (req, res, next) => {
  try {
    const aulaalumnos = await aulaalumnosService.getAllAulaAlumnos();
    sendResponse(res, { data: aulaalumnos });
  } catch (err) {
    next(err);
  }
};

exports.getAulaAlumnoById = async (req, res, next) => {
  try {
    const aulaalumno = await aulaalumnosService.getAulaAlumnoById(req.params.id);
    if (!aulaalumno) return sendResponse(res, { state: 'failed', data: null, message: 'AulaAlumno no encontrado', action_code: 404 });
    sendResponse(res, { data: aulaalumno });
  } catch (err) {
    next(err);
  }
};

exports.createAulaAlumno = async (req, res, next) => {
  try {
    const newAulaAlumno = await aulaalumnosService.createAulaAlumno(req.body);
    sendResponse(res, { data: newAulaAlumno, message: 'AulaAlumno creado', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateAulaAlumno = async (req, res, next) => {
  try {
    const updatedAulaAlumno = await aulaalumnosService.updateAulaAlumno(req.params.id, req.body);
    if (!updatedAulaAlumno) return sendResponse(res, { state: 'failed', data: null, message: 'AulaAlumno no encontrado', action_code: 404 });
    sendResponse(res, { data: updatedAulaAlumno, message: 'AulaAlumno actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.deleteAulaAlumno = async (req, res, next) => {
  try {
    const deleted = await aulaalumnosService.deleteAulaAlumno(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'AulaAlumno no encontrado', action_code: 404 });
    sendResponse(res, { data: null, message: 'AulaAlumno eliminado' });
  } catch (err) {
    next(err);
  }
};
