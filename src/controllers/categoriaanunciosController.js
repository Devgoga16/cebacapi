const categoriaanunciosService = require('../services/categoriaanunciosService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

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
    audit.registrar({
      accion: 'CATEGORIA_ANUNCIO_CREADA',
      entidad: 'CategoriaAnuncio',
      id_entidad: newCategoria._id?.toString(),
      actor: req.actor,
      descripcion: `Categoría de anuncio "${req.body.nombre}" creada`,
      payload: req.body,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: newCategoria, message: 'Categoría creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateCategoriaAnuncio = async (req, res, next) => {
  try {
    const updatedCategoria = await categoriaanunciosService.updateCategoriaAnuncio(req.params.id, req.body);
    if (!updatedCategoria) return sendResponse(res, { state: 'failed', data: null, message: 'Categoría no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'CATEGORIA_ANUNCIO_ACTUALIZADA',
      entidad: 'CategoriaAnuncio',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Categoría de anuncio ${req.params.id} actualizada`,
      payload: req.body,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: updatedCategoria, message: 'Categoría actualizada' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategoriaAnuncio = async (req, res, next) => {
  try {
    const deleted = await categoriaanunciosService.deleteCategoriaAnuncio(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Categoría no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'CATEGORIA_ANUNCIO_ELIMINADA',
      entidad: 'CategoriaAnuncio',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Categoría de anuncio ${req.params.id} eliminada`,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: null, message: 'Categoría eliminada' });
  } catch (err) {
    next(err);
  }
};
