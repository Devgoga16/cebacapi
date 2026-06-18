const iglesiasService = require('../services/iglesiasService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

exports.getAllIglesias = async (req, res, next) => {
  try {
    const iglesias = await iglesiasService.getAllIglesias();
    sendResponse(res, { data: iglesias });
  } catch (err) {
    next(err);
  }
};

exports.getIglesiaById = async (req, res, next) => {
  try {
    const iglesia = await iglesiasService.getIglesiaById(req.params.id);
    if (!iglesia) return sendResponse(res, { state: 'failed', data: null, message: 'Iglesia no encontrada', action_code: 404 });
    sendResponse(res, { data: iglesia });
  } catch (err) {
    next(err);
  }
};

exports.createIglesia = async (req, res, next) => {
  try {
    const newIglesia = await iglesiasService.createIglesia(req.body);
    audit.registrar({
      accion: 'IGLESIA_CREADA',
      entidad: 'Iglesia',
      id_entidad: newIglesia._id?.toString(),
      actor: req.actor,
      descripcion: `Iglesia "${req.body.nombre_iglesia}" creada`,
      payload: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: newIglesia, message: 'Iglesia creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateIglesia = async (req, res, next) => {
  try {
    const updatedIglesia = await iglesiasService.updateIglesia(req.params.id, req.body);
    if (!updatedIglesia) return sendResponse(res, { state: 'failed', data: null, message: 'Iglesia no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'IGLESIA_ACTUALIZADA',
      entidad: 'Iglesia',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Iglesia ${req.params.id} actualizada`,
      payload: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: updatedIglesia, message: 'Iglesia actualizada' });
  } catch (err) {
    next(err);
  }
};

exports.deleteIglesia = async (req, res, next) => {
  try {
    const deleted = await iglesiasService.deleteIglesia(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Iglesia no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'IGLESIA_ELIMINADA',
      entidad: 'Iglesia',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Iglesia ${req.params.id} eliminada`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: null, message: 'Iglesia eliminada' });
  } catch (err) {
    next(err);
  }
};

exports.getIglesiasConMinisterios = async (req, res, next) => {
  try {
    const data = await iglesiasService.getIglesiasConMinisterios();
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};
