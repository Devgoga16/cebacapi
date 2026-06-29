const personasAnalyticsService = require('../services/personasAnalyticsService');
const { sendResponse } = require('../utils/helpers');

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
