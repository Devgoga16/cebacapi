const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema(
  {
    persona_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    token: { type: String, required: true },
    platform: { type: String, enum: ['android', 'ios', 'web'], default: 'android' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true },
);

fcmTokenSchema.index({ persona_id: 1 });
fcmTokenSchema.index({ token: 1 }, { unique: true });

module.exports = mongoose.model('FcmToken', fcmTokenSchema);
