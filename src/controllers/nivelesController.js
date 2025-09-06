const nivelesService = require('../services/nivelesService');
const { sendResponse } = require('../utils/helpers');

exports.getAllNiveles = async (req, res, next) => {
  try {
    const niveles = await nivelesService.getAllNiveles();
    sendResponse(res, { data: niveles });
  } catch (err) {
    next(err);
  }
};

exports.getNivelById = async (req, res, next) => {
  try {
    const nivel = await nivelesService.getNivelById(req.params.id);
    if (!nivel) return sendResponse(res, { state: 'failed', data: null, message: 'Nivel no encontrado', action_code: 404 });
    sendResponse(res, { data: nivel });
  } catch (err) {
    next(err);
  }
};

exports.createNivel = async (req, res, next) => {
  try {
    const newNivel = await nivelesService.createNivel(req.body);
    sendResponse(res, { data: newNivel, message: 'Nivel creado', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateNivel = async (req, res, next) => {
  try {
    const updatedNivel = await nivelesService.updateNivel(req.params.id, req.body);
    if (!updatedNivel) return sendResponse(res, { state: 'failed', data: null, message: 'Nivel no encontrado', action_code: 404 });
    sendResponse(res, { data: updatedNivel, message: 'Nivel actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.deleteNivel = async (req, res, next) => {
  try {
    const deleted = await nivelesService.deleteNivel(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Nivel no encontrado', action_code: 404 });
    sendResponse(res, { data: null, message: 'Nivel eliminado' });
  } catch (err) {
    next(err);
  }
};
