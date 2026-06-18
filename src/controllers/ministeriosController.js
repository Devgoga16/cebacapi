const ministeriosService = require('../services/ministeriosService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

exports.getAllMinisterios = async (req, res, next) => {
  try {
    const ministerios = await ministeriosService.getAllMinisterios();
    sendResponse(res, { data: ministerios });
  } catch (err) {
    next(err);
  }
};

exports.getMinisterioById = async (req, res, next) => {
  try {
    const ministerio = await ministeriosService.getMinisterioById(req.params.id);
    if (!ministerio) return sendResponse(res, { state: 'failed', data: null, message: 'Ministerio no encontrado', action_code: 404 });
    sendResponse(res, { data: ministerio });
  } catch (err) {
    next(err);
  }
};

exports.getMinisteriosByIglesia = async (req, res, next) => {
  try {
    const ministerios = await ministeriosService.getMinisteriosByIglesia(req.params.id);
    sendResponse(res, { data: ministerios });
  } catch (err) {
    next(err);
  }
};

exports.createMinisterio = async (req, res, next) => {
  try {
    const newMinisterio = await ministeriosService.createMinisterio(req.body);
    audit.registrar({
      accion: 'MINISTERIO_CREADO',
      entidad: 'Ministerio',
      id_entidad: newMinisterio._id?.toString(),
      actor: req.actor,
      descripcion: `Ministerio "${req.body.nombre_ministerio}" creado`,
      payload: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: newMinisterio, message: 'Ministerio creado', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateMinisterio = async (req, res, next) => {
  try {
    const updatedMinisterio = await ministeriosService.updateMinisterio(req.params.id, req.body);
    if (!updatedMinisterio) return sendResponse(res, { state: 'failed', data: null, message: 'Ministerio no encontrado', action_code: 404 });
    audit.registrar({
      accion: 'MINISTERIO_ACTUALIZADO',
      entidad: 'Ministerio',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Ministerio ${req.params.id} actualizado`,
      payload: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: updatedMinisterio, message: 'Ministerio actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.deleteMinisterio = async (req, res, next) => {
  try {
    const deleted = await ministeriosService.deleteMinisterio(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Ministerio no encontrado', action_code: 404 });
    audit.registrar({
      accion: 'MINISTERIO_ELIMINADO',
      entidad: 'Ministerio',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Ministerio ${req.params.id} eliminado`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: null, message: 'Ministerio eliminado' });
  } catch (err) {
    next(err);
  }
};
