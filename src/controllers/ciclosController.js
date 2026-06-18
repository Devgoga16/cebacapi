const ciclosService = require('../services/ciclosService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

exports.getAllCiclos = async (req, res, next) => {
  try {
    const ciclos = await ciclosService.getAllCiclos();
    sendResponse(res, { data: ciclos });
  } catch (err) {
    next(err);
  }
};

exports.getCicloById = async (req, res, next) => {
  try {
    const ciclo = await ciclosService.getCicloById(req.params.id);
    if (!ciclo) return sendResponse(res, { state: 'failed', data: null, message: 'Ciclo no encontrado', action_code: 404 });
    sendResponse(res, { data: ciclo });
  } catch (err) {
    next(err);
  }
};

exports.createCiclo = async (req, res, next) => {
  try {
    const newCiclo = await ciclosService.createCiclo(req.body);
    audit.registrar({
      accion: 'CICLO_CREADO',
      entidad: 'Ciclo',
      id_entidad: newCiclo._id?.toString(),
      actor: req.actor,
      descripcion: `Ciclo "${newCiclo.nombre_ciclo}" (${newCiclo.año}) creado`,
      payload: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: newCiclo, message: 'Ciclo creado', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateCiclo = async (req, res, next) => {
  try {
    const updatedCiclo = await ciclosService.updateCiclo(req.params.id, req.body);
    if (!updatedCiclo) return sendResponse(res, { state: 'failed', data: null, message: 'Ciclo no encontrado', action_code: 404 });
    audit.registrar({
      accion: 'CICLO_ACTUALIZADO',
      entidad: 'Ciclo',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Ciclo ${req.params.id} actualizado`,
      payload: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: updatedCiclo, message: 'Ciclo actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.deleteCiclo = async (req, res, next) => {
  try {
    const deleted = await ciclosService.deleteCiclo(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Ciclo no encontrado', action_code: 404 });
    audit.registrar({
      accion: 'CICLO_ELIMINADO',
      entidad: 'Ciclo',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Ciclo ${req.params.id} eliminado`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: null, message: 'Ciclo eliminado' });
  } catch (err) {
    next(err);
  }
};
