const asistenciasService = require('../services/asistenciasService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

exports.getRosterDeAulaParaAsistencia = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const { fecha } = req.query;
    const data = await asistenciasService.getRosterDeAulaParaAsistencia(id_aula, fecha);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.tomarAsistencia = async (req, res, next) => {
  try {
    const { items, tomado_por, fecha, motivo_fecha_diferente } = req.body || {};
    const result = await asistenciasService.tomarAsistencia({ items, tomado_por, fecha, motivo_fecha_diferente });
    audit.registrar({
      accion: 'ASISTENCIA_REGISTRADA',
      entidad: 'Asistencia',
      actor: req.actor,
      descripcion: `Asistencia del ${fecha || 'fecha no especificada'} registrada por ${tomado_por || 'desconocido'} — ${(items || []).length} alumnos`
        + (motivo_fecha_diferente ? ` (fecha distinta al día del aula, motivo: "${motivo_fecha_diferente}")` : ''),
      payload: { fecha, tomado_por, total: (items || []).length, motivo_fecha_diferente: motivo_fecha_diferente || undefined },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: result, message: 'Asistencia registrada' });
  } catch (err) { next(err); }
};

exports.getAsistenciasDeAulaPorFecha = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const { fecha } = req.query;
    const data = await asistenciasService.getAsistenciasDeAulaPorFecha(id_aula, fecha);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.getResumenDetalleAsistenciaAlumno = async (req, res, next) => {
  try {
    const { id_aula, id_alumno } = req.params;
    const { desde, hasta } = req.query;
    const data = await asistenciasService.getResumenDetalleAsistenciaAlumno(id_aula, id_alumno, { desde, hasta });
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.getReporteAsistenciasPorCiclo = async (req, res, next) => {
  try {
    const { id_ciclo } = req.params;
    const data = await asistenciasService.getReporteAsistenciasPorCiclo(id_ciclo);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.getAlumnosPorMinisterioPorCiclo = async (req, res, next) => {
  try {
    const { id_ciclo } = req.params;
    const data = await asistenciasService.getAlumnosPorMinisterioPorCiclo(id_ciclo);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};
