const { getLogsConnection } = require('../config/dbLogs');
const AuditLogSchema = require('../models/auditLog');

let AuditLog = null;

async function getModel() {
  if (AuditLog) return AuditLog;
  const conn = await getLogsConnection();
  AuditLog = conn.models.AuditLog || conn.model('AuditLog', AuditLogSchema);
  return AuditLog;
}

/**
 * Registra una acción auditable de forma no bloqueante (fire-and-forget).
 *
 * @param {object} data
 * @param {string} data.accion        - Código de la acción  ej: 'AULA_CREADA'
 * @param {string} data.entidad       - Nombre de la entidad ej: 'Aula'
 * @param {string} [data.id_entidad]  - ID del documento afectado
 * @param {object} [data.actor]       - { id_usuario, username }
 * @param {string} [data.descripcion] - Texto libre legible
 * @param {object} [data.payload]     - Datos relevantes del evento
 * @param {string} [data.ip]
 * @param {string} [data.user_agent]
 */
function registrar(data) {
  getModel()
    .then((Model) => Model.create(data))
    .catch((err) => console.error('[AuditLog] Error al registrar:', err.message));
}

module.exports = { registrar };
