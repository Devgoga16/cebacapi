const aulaalumnosService = require('../services/aulaalumnosService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

exports.getAllAulaAlumnos = async (req, res, next) => {
  try {
    const aulaalumnos = await aulaalumnosService.getAllAulaAlumnos();
    sendResponse(res, { data: aulaalumnos });
  } catch (err) {
    next(err);
  }
};

exports.getAulaAlumnoById = async (req, res, next) => {
  try {
    const aulaalumno = await aulaalumnosService.getAulaAlumnoById(req.params.id);
    if (!aulaalumno) return sendResponse(res, { state: 'failed', data: null, message: 'AulaAlumno no encontrado', action_code: 404 });
    sendResponse(res, { data: aulaalumno });
  } catch (err) {
    next(err);
  }
};

exports.createAulaAlumno = async (req, res, next) => {
  try {
    const newAulaAlumno = await aulaalumnosService.createAulaAlumno(req.body);
    audit.registrar({
      accion: 'AULAALUMNO_CREADO',
      entidad: 'AulaAlumno',
      id_entidad: newAulaAlumno._id?.toString(),
      actor: req.actor,
      descripcion: `Alumno ${req.body.id_alumno} asignado al aula ${req.body.id_aula}`,
      payload: req.body,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: newAulaAlumno, message: 'AulaAlumno creado', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateAulaAlumno = async (req, res, next) => {
  try {
    const updatedAulaAlumno = await aulaalumnosService.updateAulaAlumno(req.params.id, req.body);
    if (!updatedAulaAlumno) return sendResponse(res, { state: 'failed', data: null, message: 'AulaAlumno no encontrado', action_code: 404 });
    audit.registrar({
      accion: 'AULAALUMNO_ACTUALIZADO',
      entidad: 'AulaAlumno',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `AulaAlumno ${req.params.id} actualizado — estado: ${req.body.estado || 'sin cambio'}`,
      payload: req.body,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: updatedAulaAlumno, message: 'AulaAlumno actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.deleteAulaAlumno = async (req, res, next) => {
  try {
    const deleted = await aulaalumnosService.deleteAulaAlumno(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'AulaAlumno no encontrado', action_code: 404 });
    audit.registrar({
      accion: 'AULAALUMNO_ELIMINADO',
      entidad: 'AulaAlumno',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `AulaAlumno ${req.params.id} eliminado`,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: null, message: 'AulaAlumno eliminado' });
  } catch (err) {
    next(err);
  }
};

exports.getAulaAlumnosPorPersona = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const { groupBy } = req.query || {};
    const data = await aulaalumnosService.getAulaAlumnosPorPersona(id_persona, { groupBy });
    sendResponse(res, { data, message: 'Registros de AulaAlumno por persona' });
  } catch (err) {
    next(err);
  }
};

exports.bulkCreateAulaAlumnos = async (req, res, next) => {
  try {
    const { id_alumno, id_aulas, carta_pastoral, ...additionalData } = req.body || {};
    if (carta_pastoral) additionalData.carta_pastoral = carta_pastoral;
    const result = await aulaalumnosService.bulkCreateAulaAlumnos(id_alumno, id_aulas, additionalData);
    audit.registrar({
      accion: 'AULAALUMNO_BULK_CREADO',
      entidad: 'AulaAlumno',
      actor: req.actor,
      descripcion: `Alumno ${id_alumno} inscrito en ${(id_aulas || []).length} aulas de forma masiva`,
      payload: { id_alumno, id_aulas },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: result, message: 'Inserción masiva realizada' });
  } catch (err) {
    next(err);
  }
};

exports.inscribirAulaAlumno = async (req, res, next) => {
  try {
    const aulaAlumno = await aulaalumnosService.inscribirAulaAlumno(req.params.id);
    audit.registrar({
      accion: 'ALUMNO_INSCRITO',
      entidad: 'AulaAlumno',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `AulaAlumno ${req.params.id} marcado como inscrito`,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: aulaAlumno, message: 'AulaAlumno inscrito exitosamente' });
  } catch (err) {
    next(err);
  }
};

exports.actualizarEstadosPorNotaPonderada = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const resultado = await aulaalumnosService.actualizarEstadosPorNotaPonderada(id_aula);
    audit.registrar({
      accion: 'ESTADOS_ACTUALIZADOS_NOTA',
      entidad: 'AulaAlumno',
      id_entidad: id_aula,
      actor: req.actor,
      descripcion: `Estados del aula ${id_aula} actualizados automáticamente según nota ponderada`,
      payload: resultado,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: resultado, message: 'Estados actualizados según nota ponderada' });
  } catch (err) {
    next(err);
  }
};

exports.getSolicitudesDeRetiro = async (req, res, next) => {
  try {
    const solicitudes = await aulaalumnosService.getSolicitudesDeRetiro();
    sendResponse(res, { data: solicitudes, message: 'Solicitudes de retiro obtenidas exitosamente' });
  } catch (err) {
    next(err);
  }
};
