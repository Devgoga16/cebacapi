const mongoose = require('mongoose');
const asistenciasService = require('../services/asistenciasService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');
const firebase = require('../services/firebaseService');
const Aula = mongoose.models.Aula || require('../models/aula');
const Curso = mongoose.models.Curso || require('../models/curso');
const Persona = mongoose.models.Persona || require('../models/persona');

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
        if (tomado_por) {
          const p = await Persona.findById(tomado_por).select('nombres apellido_paterno').lean();
          if (p) docenteNombre = `${p.nombres || ''} ${p.apellido_paterno || ''}`.trim();
        }
        const alumnoIds = items.map(i => i.id_alumno).filter(Boolean);
        if (alumnoIds.length) {
          firebase.enviarPushAMuchos(alumnoIds, {
            titulo: `Asistencia registrada`,
            cuerpo: `${docenteNombre} registró asistencia en ${courseName}`,
            data: { tipo: 'asistencia', aula_id: String(aulaId) },
          });
        }
      } catch {}
    })();
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

exports.getFechasAsistenciaDeAula = async (req, res, next) => {
  try {
    const { id_aula } = req.params;
    const data = await asistenciasService.getFechasAsistenciaDeAula(id_aula);
    sendResponse(res, { data, message: 'Fechas de asistencia obtenidas correctamente' });
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
