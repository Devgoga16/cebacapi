const personasAnalyticsService = require('../services/personasAnalyticsService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

/**
 * POST /analytics/personas
 * body: { filtros, agruparPor, cruzarCon, incluirDetalle }
 */
exports.query = async (req, res, next) => {
  try {
    const { filtros, agruparPor, cruzarCon, incluirDetalle } = req.body || {};
    const data = await personasAnalyticsService.query({ filtros, agruparPor, cruzarCon, incluirDetalle });
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /analytics/personas/export
 * body: { filtros }
 * Descarga un Excel con el listado completo de personas que cumplen los filtros.
 */
exports.exportar = async (req, res, next) => {
  try {
    const { filtros } = req.body || {};
    const { workbook, total } = await personasAnalyticsService.exportarExcel(filtros || {});

    audit.registrar({
      accion: 'PERSONAS_EXPORTADAS_EXCEL',
      entidad: 'Persona',
      actor: req.actor,
      descripcion: `Exportación a Excel de ${total} persona(s) con datos personales (teléfono, documento, dirección)`,
      payload: { filtros: filtros || {}, total },
      request_body: req.body,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });

    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Personas_filtradas_${fecha}.xlsx"`);
    res.setHeader('X-Total-Personas', String(total));

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    if (res.headersSent) return res.end();
    next(err);
  }
};
