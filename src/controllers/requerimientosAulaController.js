const service = require('../services/requerimientosAulaService');

exports.crear = async (req, res, next) => {
  try {
    const reqData = {
      id_aula: req.body.id_aula,
      id_persona: req.body.id_persona,
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      fecha: req.body.fecha
    };
    const result = await service.crearRequerimiento(reqData);
    res.status(201).json({
      state: 'success',
      data: result,
      message: 'Requerimiento creado exitosamente',
      action_code: 201
    });
  } catch (e) { next(e); }
};

exports.listarTodos = async (req, res, next) => {
  try {
    const result = await service.listarTodosRequerimientos();
    res.json({
      state: 'success',
      data: result,
      message: 'Todos los requerimientos obtenidos exitosamente',
      action_code: 200
    });
  } catch (e) { next(e); }
};

exports.listarPorAula = async (req, res, next) => {
  try {
    const result = await service.listarRequerimientosPorAula(req.params.id_aula);
    res.json({
      state: 'success',
      data: result,
      message: 'Requerimientos obtenidos exitosamente',
      action_code: 200
    });
  } catch (e) { next(e); }
};

exports.marcarRevisado = async (req, res, next) => {
  try {
    const result = await service.marcarComoRevisado(req.params.id);
    if (!result) {
      return res.status(404).json({
        state: 'error',
        message: 'Requerimiento no encontrado',
        action_code: 404
      });
    }
    res.json({
      state: 'success',
      data: result,
      message: 'Requerimiento marcado como revisado',
      action_code: 200
    });
  } catch (e) { next(e); }
};

exports.atender = async (req, res, next) => {
  try {
    const evidencia = req.body.evidencia || null; // {data, filename, mimetype, size}
    const atendido_por = req.body.atendido_por;
    const result = await service.atenderRequerimiento(req.params.id, evidencia, atendido_por);
    if (!result) {
      return res.status(404).json({
        state: 'error',
        message: 'Requerimiento no encontrado',
        action_code: 404
      });
    }
    res.json({
      state: 'success',
      data: result,
      message: 'Requerimiento atendido exitosamente',
      action_code: 200
    });
  } catch (e) { next(e); }
};