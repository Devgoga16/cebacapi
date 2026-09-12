const service = require('../services/gruposEvaluacionService');
const audit = require('../services/auditService');

exports.getAll = async (req, res, next) => {
  try {
    const grupos = await service.getAll();
    res.json({ state: 'success', data: grupos, message: 'Grupos de evaluación obtenidos', action_code: null });
  } catch (err) { next(err); }
};

exports.getActivos = async (req, res, next) => {
  try {
    const grupos = await service.getActivos();
    res.json({ state: 'success', data: grupos, message: 'Grupos activos obtenidos', action_code: null });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const grupo = await service.getById(req.params.id);
    if (!grupo) return res.status(404).json({ state: 'failed', data: null, message: 'Grupo no encontrado', action_code: 404 });
    res.json({ state: 'success', data: grupo, message: null, action_code: 200 });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const grupo = await service.create(req.body);
    audit.registrar({
      accion: 'GRUPO_EVALUACION_CREADO', entidad: 'GrupoEvaluacion', id_entidad: grupo._id?.toString(),
      actor: req.actor, descripcion: `Grupo de evaluación "${req.body.nombre}" creado`,
      payload: req.body, request_body: req.body, ip: req.ip, user_agent: req.headers['user-agent'],
    });
    res.status(201).json({ state: 'success', data: grupo, message: 'Grupo creado', action_code: 201 });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const grupo = await service.update(req.params.id, req.body);
    if (!grupo) return res.status(404).json({ state: 'failed', data: null, message: 'Grupo no encontrado', action_code: 404 });
    audit.registrar({
      accion: 'GRUPO_EVALUACION_ACTUALIZADO', entidad: 'GrupoEvaluacion', id_entidad: req.params.id,
      actor: req.actor, descripcion: `Grupo de evaluación ${req.params.id} actualizado`,
      payload: req.body, request_body: req.body, ip: req.ip, user_agent: req.headers['user-agent'],
    });
    res.json({ state: 'success', data: grupo, message: 'Grupo actualizado', action_code: 200 });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const deleted = await service.delete(req.params.id);
    if (!deleted) return res.status(404).json({ state: 'failed', data: null, message: 'Grupo no encontrado', action_code: 404 });
    audit.registrar({
      accion: 'GRUPO_EVALUACION_ELIMINADO', entidad: 'GrupoEvaluacion', id_entidad: req.params.id,
      actor: req.actor, descripcion: `Grupo de evaluación ${req.params.id} eliminado`,
      request_body: req.body, ip: req.ip, user_agent: req.headers['user-agent'],
    });
    res.json({ state: 'success', data: null, message: 'Grupo eliminado', action_code: 200 });
  } catch (err) { next(err); }
};
