const mongoose = require('mongoose');

const TIPOS_NOTIFICACION = ['reaccion', 'comentario', 'publicacion', 'recurso'];

const notificacionSchema = new mongoose.Schema(
  {
    destinatario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    tipo: { type: String, enum: TIPOS_NOTIFICACION, required: true },
    publicacion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Publicacion', default: null },
    recurso_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recurso', default: null },
    actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', default: null },
    actor_rol: { type: String, default: null },
    mensaje: { type: String, default: '' },
    leida: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificacionSchema.index({ destinatario_id: 1, leida: 1, createdAt: -1 });
notificacionSchema.index({ destinatario_id: 1, createdAt: -1 });
notificacionSchema.index({ publicacion_id: 1 });

module.exports = mongoose.model('Notificacion', notificacionSchema);
module.exports.TIPOS_NOTIFICACION = TIPOS_NOTIFICACION;
