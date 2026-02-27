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
    console.log('ID recibido en getAulaById:', req.params.id); // DEBUG
    const aula = await aulasService.getAulaById(req.params.id);
    if (!aula) return sendResponse(res, { state: 'failed', data: null, message: 'Aula no encontrada', action_code: 404 });
    sendResponse(res, { data: aula });
  } catch (err) {
    next(err);
  }
};


const { validateAulaInput } = require('../utils/aulaValidator');

exports.createAula = async (req, res, next) => {
  try {
    const errors = validateAulaInput(req.body);
    if (errors.length) {
      return sendResponse(res, { state: 'failed', data: null, message: errors.join(', '), action_code: 400 });
    }
    const newAula = await aulasService.createAula(req.body);
    sendResponse(res, { data: newAula, message: 'Aula creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

// Convierte snake_case a camelCase para los campos personalizados
function normalizeAulaFields(body) {
  if (body.link_whatsapp) {
    body.linkWhatsApp = body.link_whatsapp;
    delete body.link_whatsapp;
  }
  if (body.numero_aula) {
    body.numeroAula = body.numero_aula;
    delete body.numero_aula;
  }
  return body;
}

exports.updateAula = async (req, res, next) => {
  try {
    const normalizedBody = normalizeAulaFields({ ...req.body });
    console.log('Body normalizado en updateAula:', normalizedBody); // DEBUG
    const errors = validateAulaInput(normalizedBody);
    if (errors.length) {
      return sendResponse(res, { state: 'failed', data: null, message: errors.join(', '), action_code: 400 });
    }
    const updatedAula = await aulasService.updateAula(req.params.id, normalizedBody);
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

exports.deleteAulaCompleto = async (req, res, next) => {
  try {
    const result = await aulasService.deleteAulaCompleto(req.params.id);
    if (!result.success) {
      return sendResponse(res, { 
        state: 'failed', 
        data: null, 
        message: result.message, 
        action_code: 404 
      });
    }
    sendResponse(res, { 
      data: result.deletedInfo, 
      message: result.message 
    });
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

exports.getReporteExcelAula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query || {};
    const data = await aulasService.getReporteExcelAula(id, { desde, hasta });
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};
