const mongoose = require('mongoose');
const calificacionesService = require('../services/calificacionesService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');
const firebase = require('../services/firebaseService');
const Aula = mongoose.models.Aula || require('../models/aula');
const Curso = mongoose.models.Curso || require('../models/curso');
const Persona = mongoose.models.Persona || require('../models/persona');

exports.getRosterDeAulaParaCalificaciones = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const data = await calificacionesService.getRosterDeAulaParaCalificaciones(id_aula);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.registrarCalificaciones = async (req, res, next) => {
  try {
    const { items, registrado_por } = req.body || {};
    const result = await calificacionesService.registrarCalificaciones({ items, registrado_por });
    audit.registrar({
      accion: 'CALIFICACIONES_REGISTRADAS',
      entidad: 'Calificacion',
      actor: req.actor,
      descripcion: `${(items || []).length} calificaciones registradas por ${registrado_por || 'desconocido'}`,
      payload: { total: (items || []).length, registrado_por },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: result, message: 'Calificaciones registradas exitosamente' });

    // Push notification a los alumnos
    (async () => {
      try {
        if (!items || !items.length) return;
        const aulaId = items[0].id_aula;
        const aula = await Aula.findById(aulaId).select('id_curso').lean();
        let courseName = 'tu aula';
        if (aula?.id_curso) {
          const curso = await Curso.findById(aula.id_curso).select('nombre_curso').lean();
          if (curso) courseName = curso.nombre_curso;
        }
        let docenteNombre = 'El docente';
        if (registrado_por) {
          const p = await Persona.findById(registrado_por).select('nombres apellido_paterno').lean();
          if (p) docenteNombre = `${p.nombres || ''} ${p.apellido_paterno || ''}`.trim();
        }
        const alumnoIds = [...new Set(items.map(i => i.id_alumno).filter(Boolean))];
        if (alumnoIds.length) {
          firebase.enviarPushAMuchos(alumnoIds, {
            titulo: 'Nuevas calificaciones',
            cuerpo: `${docenteNombre} registró notas en ${courseName}`,
            data: { tipo: 'calificacion', aula_id: String(aulaId) },
          });
        }
      } catch {}
    })();
  } catch (err) { next(err); }
};

exports.getCalificacionesDeAlumno = async (req, res, next) => {
  try {
    const { id_aula, id_alumno } = req.params;
    const data = await calificacionesService.getCalificacionesDeAlumno(id_aula, id_alumno);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.getResumenCalificacionesAula = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const data = await calificacionesService.getResumenCalificacionesAula(id_aula);
    sendResponse(res, { data });
  } catch (err) { next(err); }
};

exports.deleteCalificacion = async (req, res, next) => {
  try {
    const { id_aula, id_alumno, id_tipo_calificacion } = req.params;
    const result = await calificacionesService.deleteCalificacion(id_aula, id_alumno, id_tipo_calificacion);
    audit.registrar({
      accion: 'CALIFICACION_ELIMINADA',
      entidad: 'Calificacion',
      actor: req.actor,
      descripcion: `Calificación eliminada — aula: ${id_aula}, alumno: ${id_alumno}, tipo: ${id_tipo_calificacion}`,
      payload: { id_aula, id_alumno, id_tipo_calificacion },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: { deletedCount: result.deletedCount }, message: 'Calificación eliminada' });
  } catch (err) { next(err); }
};

exports.recalcularPromediosPonderadosAula = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const resultado = await calificacionesService.recalcularPromediosPonderadosAula(id_aula);
    audit.registrar({
      accion: 'PROMEDIOS_RECALCULADOS',
      entidad: 'AulaAlumno',
      id_entidad: id_aula,
      actor: req.actor,
      descripcion: `Promedios ponderados recalculados para el aula ${id_aula}`,
      payload: resultado,
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: resultado, message: 'Promedios ponderados recalculados exitosamente' });
  } catch (err) { next(err); }
};
