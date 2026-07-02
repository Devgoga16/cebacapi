const mongoose = require('mongoose');

const MensajeAulaSchema = new mongoose.Schema({
  aula_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', required: true },
  autor_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  autor_nombre: { type: String, required: true, trim: true },
  autor_rol:    { type: String, enum: ['Estudiante', 'Docente', 'Coordinador', 'Admin'], required: true },
  contenido:    { type: String, required: true, trim: true, maxlength: 1000 },
  eliminado:    { type: Boolean, default: false },
}, {
  collection: 'mensajes_aula',
  timestamps: true,
});

MensajeAulaSchema.index({ aula_id: 1, createdAt: -1 });

module.exports = mongoose.model('MensajeAula', MensajeAulaSchema);
