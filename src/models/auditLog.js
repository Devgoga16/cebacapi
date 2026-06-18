const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    accion: { type: String, required: true, index: true },
    entidad: { type: String, required: true, index: true },
    id_entidad: { type: String, default: null },
    actor: {
      id_usuario: { type: String, default: null },
      username: { type: String, default: null },
    },
    descripcion: { type: String, default: '' },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    request_body: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    user_agent: { type: String, default: null },
  },
  {
    collection: 'audit_logs',
    timestamps: true,
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ 'actor.id_usuario': 1 });

// El modelo se registra sobre una conexión dinámica; se construye en auditService.
module.exports = AuditLogSchema;
