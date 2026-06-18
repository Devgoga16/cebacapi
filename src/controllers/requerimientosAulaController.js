const service = require('../services/requerimientosAulaService');
const audit = require('../services/auditService');

exports.crear = async (req, res, next) => {
  try {
    const reqData = {
      id_aula: req.body.id_aula,
      id_persona: req.body.id_persona,
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      fecha: req.body.fecha,
    };
    const result = await service.crearRequerimiento(reqData);
    audit.registrar({
      accion: 'REQUERIMIENTO_CREADO',
      entidad: 'RequerimientoAula',
      id_entidad: result._id?.toString(),
      actor: req.actor,
      descripcion: `Requerimiento "${req.body.nombre}" creado para aula ${req.body.id_aula}`,
      payload: reqData,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    res.status(201).json({ state: 'success', data: result, message: 'Requerimiento creado exitosamente', action_code: 201 });
  } catch (e) { next(e); }
};

exports.listarTodos = async (req, res, next) => {
  try {
    const result = await service.listarTodosRequerimientos();
    res.json({ state: 'success', data: result, message: 'Todos los requerimientos obtenidos exitosamente', action_code: 200 });
  } catch (e) { next(e); }
};

exports.listarPorAula = async (req, res, next) => {
  try {
    const result = await service.listarRequerimientosPorAula(req.params.id_aula);
    res.json({ state: 'success', data: result, message: 'Requerimientos obtenidos exitosamente', action_code: 200 });
  } catch (e) { next(e); }
};

exports.marcarRevisado = async (req, res, next) => {
  try {
    const result = await service.marcarComoRevisado(req.params.id);
    if (!result) {
      return res.status(404).json({ state: 'error', message: 'Requerimiento no encontrado', action_code: 404 });
    }
    audit.registrar({
      accion: 'REQUERIMIENTO_REVISADO',
      entidad: 'RequerimientoAula',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Requerimiento ${req.params.id} marcado como revisado`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    res.json({ state: 'success', data: result, message: 'Requerimiento marcado como revisado', action_code: 200 });
  } catch (e) { next(e); }
};

exports.atender = async (req, res, next) => {
  try {
    const evidencia = req.body.evidencia || null;
    const atendido_por = req.body.atendido_por;
    const result = await service.atenderRequerimiento(req.params.id, evidencia, atendido_por);
    if (!result) {
      return res.status(404).json({ state: 'error', message: 'Requerimiento no encontrado', action_code: 404 });
    }
    audit.registrar({
      accion: 'REQUERIMIENTO_ATENDIDO',
      entidad: 'RequerimientoAula',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Requerimiento ${req.params.id} atendido por ${atendido_por || 'desconocido'}`,
      payload: { atendido_por, tiene_evidencia: !!evidencia },
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    res.json({ state: 'success', data: result, message: 'Requerimiento atendido exitosamente', action_code: 200 });
  } catch (e) { next(e); }
};
