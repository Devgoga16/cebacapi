const anunciosService = require('../services/anunciosService');
const { sendResponse } = require('../utils/helpers');

exports.getAllAnuncios = async (req, res, next) => {
  try {
    const anuncios = await anunciosService.getAllAnuncios();
    sendResponse(res, { data: anuncios });
  } catch (err) {
    next(err);
  }
};

exports.getAnuncioById = async (req, res, next) => {
  try {
    const anuncio = await anunciosService.getAnuncioById(req.params.id);
    if (!anuncio) return sendResponse(res, { state: 'failed', data: null, message: 'Anuncio no encontrado', action_code: 404 });
    sendResponse(res, { data: anuncio });
  } catch (err) {
    next(err);
  }
};

exports.createAnuncio = async (req, res, next) => {
  try {
    const newAnuncio = await anunciosService.createAnuncio(req.body);
    sendResponse(res, { data: newAnuncio, message: 'Anuncio creado', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateAnuncio = async (req, res, next) => {
  try {
    const updatedAnuncio = await anunciosService.updateAnuncio(req.params.id, req.body);
    if (!updatedAnuncio) return sendResponse(res, { state: 'failed', data: null, message: 'Anuncio no encontrado', action_code: 404 });
    sendResponse(res, { data: updatedAnuncio, message: 'Anuncio actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.deleteAnuncio = async (req, res, next) => {
  try {
    const deleted = await anunciosService.deleteAnuncio(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Anuncio no encontrado', action_code: 404 });
    sendResponse(res, { data: null, message: 'Anuncio eliminado' });
  } catch (err) {
    next(err);
  }
};
