const personasService = require('../services/personasService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

exports.getAllPersonas = async (req, res, next) => {
  try {
    const personas = await personasService.getAllPersonas();
    sendResponse(res, { data: personas });
  } catch (err) {
    next(err);
  }
};

exports.getAllPersonasByRol = async (req, res, next) => {
  try {
    const personas = await personasService.getPersonasByRol(req.params.nombre_rol);
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
    audit.registrar({
      accion: 'PERSONA_CREADA',
      entidad: 'Persona',
      id_entidad: newPersona._id?.toString(),
      actor: req.actor,
      descripcion: `Persona "${req.body.nombres} ${req.body.apellido_paterno}" creada`,
      payload: { ...req.body, imagen: undefined },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: newPersona, message: 'Persona creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updatePersona = async (req, res, next) => {
  try {
    const updatedPersona = await personasService.updatePersona(req.params.id, req.body);
    if (!updatedPersona) return sendResponse(res, { state: 'failed', data: null, message: 'Persona no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'PERSONA_ACTUALIZADA',
      entidad: 'Persona',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Persona ${req.params.id} actualizada`,
      payload: { ...req.body, imagen: undefined },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: updatedPersona, message: 'Persona actualizada' });
  } catch (err) {
    next(err);
  }
};

exports.deletePersona = async (req, res, next) => {
  try {
    const deleted = await personasService.deletePersona(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Persona no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'PERSONA_ELIMINADA',
      entidad: 'Persona',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Persona ${req.params.id} eliminada`,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: null, message: 'Persona eliminada' });
  } catch (err) {
    next(err);
  }
};

exports.buscarPersonas = async (req, res, next) => {
  try {
    const data = await personasService.buscarPersonas(req.query || {});
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

exports.importarPersonasExcel = async (req, res, next) => {
  try {
    const data = await personasService.importarPersonasDesdeExcel({
      file: req.file,
      options: req.body || {},
    });
    audit.registrar({
      accion: 'PERSONAS_IMPORTADAS',
      entidad: 'Persona',
      actor: req.actor,
      descripcion: `Importación masiva de personas desde Excel — ${data?.insertados || 0} insertadas, ${data?.errores || 0} errores`,
      payload: { insertados: data?.insertados, errores: data?.errores },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data, message: 'Importación de Excel procesada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.marcarTutorialVisto = async (req, res, next) => {
  try {
    const Persona = require('../models/persona');
    const persona = await Persona.findByIdAndUpdate(
      req.params.id,
      { tutorial_visto: true, tutorial_visto_at: new Date() },
      { new: true, select: 'tutorial_visto tutorial_visto_at' }
    );
    if (!persona) return sendResponse(res, { state: 'failed', data: null, message: 'Persona no encontrada', action_code: 404 });
    sendResponse(res, { data: persona, message: 'Tutorial marcado como visto' });
  } catch (err) {
    next(err);
  }
};

exports.getInscripcionesByPersona = async (req, res, next) => {
  try {
    const inscripciones = await personasService.getInscripcionesByPersona(req.params.id);
    sendResponse(res, {
      data: inscripciones,
      message: inscripciones.length > 0 ? 'Inscripciones encontradas' : 'No se encontraron inscripciones para esta persona',
    });
  } catch (err) {
    next(err);
  }
};
