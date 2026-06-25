const aulasService = require('../services/aulasService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');
const { validateAulaInput } = require('../utils/aulaValidator');

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
    const aula = await aulasService.getAulaById(req.params.id);
    if (!aula) return sendResponse(res, { state: 'failed', data: null, message: 'Aula no encontrada', action_code: 404 });
    sendResponse(res, { data: aula });
  } catch (err) {
    next(err);
  }
};

exports.createAula = async (req, res, next) => {
  try {
    const normalizedBody = normalizeAulaFields({ ...req.body });
    const errors = validateAulaInput(normalizedBody);
    if (errors.length) {
      return sendResponse(res, { state: 'failed', data: null, message: errors.join(', '), action_code: 400 });
    }
    const newAula = await aulasService.createAula(normalizedBody);
    audit.registrar({
      accion: 'AULA_CREADA',
      entidad: 'Aula',
      id_entidad: newAula._id?.toString(),
      actor: req.actor,
      descripcion: `Aula creada para curso ${normalizedBody.id_curso} en ciclo ${normalizedBody.id_ciclo}`,
      payload: normalizedBody,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: newAula, message: 'Aula creada', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

function normalizeAulaFields(body) {
  if (body.link_whatsapp) {
    body.linkWhatsApp = body.link_whatsapp;
    delete body.link_whatsapp;
  }
  if (body.numero_aula) {
    body.numeroAula = body.numero_aula;
    delete body.numero_aula;
  }
  // id_coordinador es opcional: si llega vacío ('' o null), se guarda como null
  // en vez de intentar castear un string vacío a ObjectId (lo cual falla).
  if ('id_coordinador' in body && !body.id_coordinador) {
    body.id_coordinador = null;
  }
  return body;
}

exports.updateAula = async (req, res, next) => {
  try {
    const normalizedBody = normalizeAulaFields({ ...req.body });
    const errors = validateAulaInput(normalizedBody);
    if (errors.length) {
      return sendResponse(res, { state: 'failed', data: null, message: errors.join(', '), action_code: 400 });
    }
    const updatedAula = await aulasService.updateAula(req.params.id, normalizedBody);
    if (!updatedAula) return sendResponse(res, { state: 'failed', data: null, message: 'Aula no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'AULA_ACTUALIZADA',
      entidad: 'Aula',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Aula ${req.params.id} actualizada`,
      payload: normalizedBody,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: updatedAula, message: 'Aula actualizada' });
  } catch (err) {
    next(err);
  }
};

exports.deleteAula = async (req, res, next) => {
  try {
    const deleted = await aulasService.deleteAula(req.params.id);
    if (!deleted) return sendResponse(res, { state: 'failed', data: null, message: 'Aula no encontrada', action_code: 404 });
    audit.registrar({
      accion: 'AULA_ELIMINADA',
      entidad: 'Aula',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Aula ${req.params.id} eliminada`,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: null, message: 'Aula eliminada' });
  } catch (err) {
    next(err);
  }
};

exports.deleteAulaCompleto = async (req, res, next) => {
  try {
    const result = await aulasService.deleteAulaCompleto(req.params.id);
    if (!result.success) {
      return sendResponse(res, { state: 'failed', data: null, message: result.message, action_code: 404 });
    }
    audit.registrar({
      accion: 'AULA_ELIMINADA_COMPLETO',
      entidad: 'Aula',
      id_entidad: req.params.id,
      actor: req.actor,
      descripcion: `Aula ${req.params.id} eliminada con todos sus registros asociados`,
      payload: result.deletedInfo,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: result.deletedInfo, message: result.message });
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

exports.getAulasByCoordinador = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const aulas = await aulasService.getAulasPorCoordinador(id_persona);
    sendResponse(res, { data: aulas });
  } catch (err) {
    next(err);
  }
};

exports.getDocentesByCoordinador = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const docentes = await aulasService.getDocentesPorCoordinador(id_persona);
    sendResponse(res, { data: docentes });
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
    audit.registrar({
      accion: 'AULA_INICIADA',
      entidad: 'Aula',
      id_entidad: id,
      actor: req.actor,
      descripcion: `Aula ${id} marcada como iniciada`,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
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

exports.crearGrupoWhatsappAula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultado = await aulasService.crearGrupoWhatsappAula(id);
    audit.registrar({
      accion: 'GRUPO_WHATSAPP_CREADO',
      entidad: 'Aula',
      id_entidad: id,
      actor: req.actor,
      descripcion: `Grupo de WhatsApp "${resultado.whatsapp?.name}" creado para el aula ${id} con ${resultado.participantes_invitados.length} participantes`,
      payload: {
        groupId: resultado.whatsapp?.groupId,
        name: resultado.whatsapp?.name,
        participantes_invitados: resultado.participantes_invitados,
      },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: resultado, message: 'Grupo de WhatsApp creado exitosamente' });
  } catch (err) {
    next(err);
  }
};
