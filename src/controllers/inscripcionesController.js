const inscripcionesService = require('../services/inscripcionesService');
const { sendResponse } = require('../utils/helpers');

exports.getAllInscripciones = async (req, res, next) => {
  try {
    const inscripciones = await inscripcionesService.getAllInscripciones();
    sendResponse(res, { data: inscripciones });
  } catch (err) {
    next(err);
  }
};

exports.getInscripcionById = async (req, res, next) => {
  try {
    const inscripcion = await inscripcionesService.getInscripcionById(req.params.id);
    if (!inscripcion) return sendResponse(res, { state: 'failed', data: null, message: 'Inscripción no encontrada', action_code: 404 });
    sendResponse(res, { data: inscripcion });
  } catch (err) {
    next(err);
  }
};

exports.createInscripcion = async (req, res, next) => {
  try {
    const newInscripcion = await inscripcionesService.createInscripcion(req.body);
    sendResponse(res, { data: newInscripcion, message: 'Inscripción creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateInscripcion = async (req, res, next) => {
  try {
    const updatedInscripcion = await inscripcionesService.updateInscripcion(req.params.id, req.body);
    if (!updatedInscripcion) return sendResponse(res, { state: 'failed', data: null, message: 'Inscripción no encontrada', action_code: 404 });
    sendResponse(res, { data: updatedInscripcion, message: 'Inscripción actualizada' });
  } catch (err) {
    next(err);
  }
};

exports.deleteInscripcion = async (req, res, next) => {
  try {
    const deleted = await inscripcionesService.deleteInscripcion(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Inscripción no encontrada', action_code: 404 });
    sendResponse(res, { data: null, message: 'Inscripción eliminada' });
  } catch (err) {
    next(err);
  }
};

exports.aprobarInscripcion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await inscripcionesService.aprobarInscripcion(id);
    sendResponse(res, { data: result.inscripcion, message: result.message });
  } catch (err) {
    next(err);
  }
};

exports.rechazarInscripcion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body || {};
    const result = await inscripcionesService.rechazarInscripcion(id, observacion);
    sendResponse(res, { data: result.inscripcion, message: result.message });
  } catch (err) {
    next(err);
  }
};
