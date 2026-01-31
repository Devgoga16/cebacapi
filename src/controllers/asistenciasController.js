const asistenciasService = require('../services/asistenciasService');
const { sendResponse } = require('../utils/helpers');

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
    const { items, tomado_por, fecha } = req.body || {};
    const result = await asistenciasService.tomarAsistencia({ items, tomado_por, fecha });
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
