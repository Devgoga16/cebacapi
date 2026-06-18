const inscripcionesService = require('../services/inscripcionesService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

exports.getAllInscripciones = async (req, res, next) => {
  try {
    const inscripciones = await inscripcionesService.getAllInscripciones();
    sendResponse(res, { data: inscripciones });
  } catch (err) {
    next(err);
  }
};

exports.getInscripcionById = async (req, res, next) => {
  try {
    const inscripcion = await inscripcionesService.getInscripcionById(req.params.id);
    if (!inscripcion) return sendResponse(res, { state: 'failed', data: null, message: 'Inscripción no encontrada', action_code: 404 });
    sendResponse(res, { data: inscripcion });
  } catch (err) {
    next(err);
  }
};

exports.createInscripcion = async (req, res, next) => {
  try {
    const newInscripcion = await inscripcionesService.createInscripcion(req.body);
    audit.registrar({
      accion: 'INSCRIPCION_CREADA',
      entidad: 'Inscripcion',
      id_entidad: newInscripcion._id?.toString(),
      actor: req.actor,
      descripcion: `Inscripción creada para alumno ${req.body.id_alumno} en aula ${req.body.id_aula}`,
      payload: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: newInscripcion, message: 'Inscripción creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateInscripcion = async (req, res, next) => {
  try {
    const updatedInscripcion = await inscripcionesService.updateInscripcion(req.params.id, req.body);
    if (!updatedInscripcion) return sendResponse(res, { state: 'failed', data: null, message: 'Inscripción no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'INSCRIPCION_ACTUALIZADA',
      entidad: 'Inscripcion',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Inscripción ${req.params.id} actualizada`,
      payload: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: updatedInscripcion, message: 'Inscripción actualizada' });
  } catch (err) {
    next(err);
  }
};

exports.deleteInscripcion = async (req, res, next) => {
  try {
    const deleted = await inscripcionesService.deleteInscripcion(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Inscripción no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'INSCRIPCION_ELIMINADA',
      entidad: 'Inscripcion',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Inscripción ${req.params.id} eliminada`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: null, message: 'Inscripción eliminada' });
  } catch (err) {
    next(err);
  }
};

exports.aprobarInscripcion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await inscripcionesService.aprobarInscripcion(id);
    audit.registrar({
      accion: 'INSCRIPCION_APROBADA',
      entidad: 'Inscripcion',
      id_entidad: id,
      actor: req.actor,
      descripcion: `Inscripción ${id} aprobada`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: result.inscripcion, message: result.message });
  } catch (err) {
    next(err);
  }
};

exports.rechazarInscripcion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { observacion } = req.body || {};
    const result = await inscripcionesService.rechazarInscripcion(id, observacion);
    audit.registrar({
      accion: 'INSCRIPCION_RECHAZADA',
      entidad: 'Inscripcion',
      id_entidad: id,
      actor: req.actor,
      descripcion: `Inscripción ${id} rechazada — observación: ${observacion || 'sin observación'}`,
      payload: { observacion },
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: result.inscripcion, message: result.message });
  } catch (err) {
    next(err);
  }
};

exports.getAulasDisponibles = async (req, res, next) => {
  try {
    const { id_persona } = req.query || {};
    const data = await inscripcionesService.getAulasDisponiblesParaInscripcion(id_persona);
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};
