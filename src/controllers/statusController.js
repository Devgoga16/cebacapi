const statusService = require('../services/statusService');

exports.getStatus = (req, res) => {
  res.json({ status: statusService.getStatus() });
};
