const dashboardService = require('../services/dashboardService');
const { sendResponse } = require('../utils/helpers');

exports.getAlumnoDashboard = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const data = await dashboardService.getAlumnoDashboard(id_persona);
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

exports.getDocenteDashboard = async (req, res, next) => {
  try {
    const { id_persona } = req.params;
    const data = await dashboardService.getDocenteDashboard(id_persona);
    sendResponse(res, { data });
  } catch (err) {
    next(err);
  }
};