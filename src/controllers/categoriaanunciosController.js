const categoriaanunciosService = require('../services/categoriaanunciosService');
const { sendResponse } = require('../utils/helpers');

exports.getAllCategoriaAnuncios = async (req, res, next) => {
  try {
    const categorias = await categoriaanunciosService.getAllCategoriaAnuncios();
    sendResponse(res, { data: categorias });
  } catch (err) {
    next(err);
  }
};

exports.getCategoriaAnuncioById = async (req, res, next) => {
  try {
    const categoria = await categoriaanunciosService.getCategoriaAnuncioById(req.params.id);
    if (!categoria) return sendResponse(res, { state: 'failed', data: null, message: 'Categoría no encontrada', action_code: 404 });
    sendResponse(res, { data: categoria });
  } catch (err) {
    next(err);
  }
};

exports.createCategoriaAnuncio = async (req, res, next) => {
  try {
    const newCategoria = await categoriaanunciosService.createCategoriaAnuncio(req.body);
    sendResponse(res, { data: newCategoria, message: 'Categoría creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateCategoriaAnuncio = async (req, res, next) => {
  try {
    const updatedCategoria = await categoriaanunciosService.updateCategoriaAnuncio(req.params.id, req.body);
    if (!updatedCategoria) return sendResponse(res, { state: 'failed', data: null, message: 'Categoría no encontrada', action_code: 404 });
    sendResponse(res, { data: updatedCategoria, message: 'Categoría actualizada' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategoriaAnuncio = async (req, res, next) => {
  try {
    const deleted = await categoriaanunciosService.deleteCategoriaAnuncio(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Categoría no encontrada', action_code: 404 });
    sendResponse(res, { data: null, message: 'Categoría eliminada' });
  } catch (err) {
    next(err);
  }
};
