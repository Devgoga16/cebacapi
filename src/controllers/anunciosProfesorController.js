const anunciosProfesorService = require('../services/anunciosProfesorService');
const { sendResponse } = require('../utils/helpers');

/**
 * Obtiene todos los anuncios de un aula
 * GET /api/anuncios-profesor/aula/:id_aula
 */
exports.getAnunciosByAula = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const anuncios = await anunciosProfesorService.getAnunciosByAula(id_aula);
    sendResponse(res, { data: anuncios });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtiene todos los anuncios creados por un profesor
 * GET /api/anuncios-profesor/profesor/:id_profesor
 */
exports.getAnunciosByProfesor = async (req, res, next) => {
  try {
    const { id_profesor } = req.params;
    const anuncios = await anunciosProfesorService.getAnunciosByProfesor(id_profesor);
    sendResponse(res, { data: anuncios });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtiene un anuncio por ID
 * GET /api/anuncios-profesor/:id
 */
exports.getAnuncioById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const anuncio = await anunciosProfesorService.getAnuncioById(id);
    sendResponse(res, { data: anuncio });
  } catch (err) {
    next(err);
  }
};

/**
 * Crea un nuevo anuncio
 * POST /api/anuncios-profesor
 */
exports.createAnuncio = async (req, res, next) => {
  try {
    const nuevoAnuncio = await anunciosProfesorService.createAnuncio(req.body);
    sendResponse(res, { 
      data: nuevoAnuncio, 
      message: 'Anuncio creado exitosamente',
      action_code: 201 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Actualiza un anuncio existente
 * PUT /api/anuncios-profesor/:id
 */
exports.updateAnuncio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const anuncioActualizado = await anunciosProfesorService.updateAnuncio(id, req.body);
    sendResponse(res, { 
      data: anuncioActualizado, 
      message: 'Anuncio actualizado exitosamente' 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Elimina un anuncio
 * DELETE /api/anuncios-profesor/:id
 */
exports.deleteAnuncio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id_profesor } = req.body; // Para validación de seguridad
    
    await anunciosProfesorService.deleteAnuncio(id, id_profesor);
    sendResponse(res, { 
      data: null, 
      message: 'Anuncio eliminado exitosamente' 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtiene anuncios recientes de un profesor
 * GET /api/anuncios-profesor/profesor/:id_profesor/recientes
 */
exports.getAnunciosRecientesByProfesor = async (req, res, next) => {
  try {
    const { id_profesor } = req.params;
    const { limite } = req.query;
    const anuncios = await anunciosProfesorService.getAnunciosRecientesByProfesor(
      id_profesor, 
      limite ? parseInt(limite) : 10
    );
    sendResponse(res, { data: anuncios });
  } catch (err) {
    next(err);
  }
};
