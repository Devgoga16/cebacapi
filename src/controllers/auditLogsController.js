const { getLogsConnection } = require('../config/dbLogs');
const AuditLogSchema = require('../models/auditLog');

async function getModel() {
  const conn = await getLogsConnection();
  return conn.models.AuditLog || conn.model('AuditLog', AuditLogSchema);
}

/**
 * GET /api/audit-logs
 * Query params: accion, entidad, id_usuario, desde, hasta, page, limit
 */
exports.getLogs = async (req, res, next) => {
  try {
    const {
      accion,
      entidad,
      id_usuario,
      desde,
      hasta,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (accion) filter.accion = { $regex: accion, $options: 'i' };
    if (entidad) filter.entidad = { $regex: entidad, $options: 'i' };
    if (id_usuario) filter['actor.id_usuario'] = id_usuario;
    if (desde || hasta) {
      filter.createdAt = {};
      if (desde) filter.createdAt.$gte = new Date(desde);
      if (hasta) filter.createdAt.$lte = new Date(hasta);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const Model = await getModel();

    const [logs, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Model.countDocuments(filter),
    ]);

    res.json({
      state: 'success',
      data: logs,
      meta: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/audit-logs/:id
 */
exports.getLogById = async (req, res, next) => {
  try {
    const Model = await getModel();
    const log = await Model.findById(req.params.id).lean();
    if (!log) return res.status(404).json({ state: 'failed', message: 'Log no encontrado' });
    res.json({ state: 'success', data: log });
  } catch (err) {
    next(err);
  }
};
