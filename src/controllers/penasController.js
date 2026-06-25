const penasService = require('../services/penasService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

/**
 * GET /penas/:idAula/roster?leccion=1
 */
exports.getRosterPena = async (req, res, next) => {
  try {
    const { idAula } = req.params;
    const { leccion } = req.query;

    const roster = await penasService.getRosterPena(idAula, leccion);

    sendResponse(res, {
      data: roster,
      message: 'Roster de peña obtenido correctamente',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /penas/:idAula/lecciones
 */
exports.getLeccionesRegistradas = async (req, res, next) => {
  try {
    const { idAula } = req.params;
    const lecciones = await penasService.getLeccionesRegistradas(idAula);

    sendResponse(res, {
      data: lecciones,
      message: 'Lecciones registradas obtenidas correctamente',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /penas/:idAula/leccion/:leccion
 * body: { items: [{ id_alumno, seccion, nota, comentario }] }
 */
exports.guardarNotasPena = async (req, res, next) => {
  try {
    const { idAula, leccion } = req.params;
    const { items, registrado_por } = req.body;

    const result = await penasService.guardarNotasPena({
      id_aula: idAula,
      leccion,
      items,
      registrado_por: registrado_por || null,
    });

    audit.registrar({
      accion: 'PENA_NOTAS_REGISTRADAS',
      entidad: 'PenaCalificacion',
      id_entidad: idAula,
      actor: req.actor,
      descripcion: `Notas de peña registradas para el aula ${idAula}, lección ${leccion} — ${items?.length || 0} secciones`,
      payload: { idAula, leccion, items },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: result,
      message: 'Notas de peña registradas correctamente',
      action_code: 201,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /penas/:idAula/leccion/:leccion
 */
exports.eliminarLeccion = async (req, res, next) => {
  try {
    const { idAula, leccion } = req.params;
    const result = await penasService.eliminarLeccion(idAula, leccion);

    audit.registrar({
      accion: 'PENA_LECCION_ELIMINADA',
      entidad: 'PenaCalificacion',
      id_entidad: idAula,
      actor: req.actor,
      descripcion: `Lección ${leccion} eliminada del aula ${idAula} — ${result.eliminadas} nota(s) eliminada(s)`,
      payload: { idAula, leccion, eliminadas: result.eliminadas },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: result,
      message: `Lección eliminada. Se eliminaron ${result.eliminadas} nota(s) asociadas.`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /penas/:idAula/leccion/:leccion/seccion/:seccion
 */
exports.eliminarSeccion = async (req, res, next) => {
  try {
    const { idAula, leccion, seccion } = req.params;
    const result = await penasService.eliminarSeccion(idAula, leccion, seccion);

    audit.registrar({
      accion: 'PENA_SECCION_ELIMINADA',
      entidad: 'PenaCalificacion',
      id_entidad: idAula,
      actor: req.actor,
      descripcion: `Sección ${seccion} de la lección ${leccion} eliminada del aula ${idAula} — ${result.eliminadas} nota(s) eliminada(s)`,
      payload: { idAula, leccion, seccion, eliminadas: result.eliminadas },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    sendResponse(res, {
      data: result,
      message: `Sección eliminada. Se eliminaron ${result.eliminadas} nota(s) asociadas.`,
    });
  } catch (err) {
    next(err);
  }
};
