const personasService = require('../services/personasService');
const { sendResponse } = require('../utils/helpers');

exports.getAllPersonas = async (req, res, next) => {
  try {
    const personas = await personasService.getAllPersonas();
    sendResponse(res, { data: personas });
  } catch (err) {
    next(err);
  }
};

exports.getPersonaById = async (req, res, next) => {
  try {
    const persona = await personasService.getPersonaById(req.params.id);
    if (!persona) return sendResponse(res, { state: 'failed', data: null, message: 'Persona no encontrada', action_code: 404 });
    sendResponse(res, { data: persona });
  } catch (err) {
    next(err);
  }
};

exports.createPersona = async (req, res, next) => {
  try {
    const newPersona = await personasService.createPersona(req.body);
    sendResponse(res, { data: newPersona, message: 'Persona creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updatePersona = async (req, res, next) => {
  try {
    const updatedPersona = await personasService.updatePersona(req.params.id, req.body);
    if (!updatedPersona) return sendResponse(res, { state: 'failed', data: null, message: 'Persona no encontrada', action_code: 404 });
    sendResponse(res, { data: updatedPersona, message: 'Persona actualizada' });
  } catch (err) {
    next(err);
  }
};

exports.deletePersona = async (req, res, next) => {
  try {
    const deleted = await personasService.deletePersona(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Persona no encontrada', action_code: 404 });
    sendResponse(res, { data: null, message: 'Persona eliminada' });
  } catch (err) {
    next(err);
  }
};
