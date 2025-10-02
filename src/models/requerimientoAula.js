const mongoose = require('mongoose');

const RequerimientoAulaSchema = new mongoose.Schema({
  id_aula: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', required: true },
  id_persona: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  fecha: { type: Date, required: true },
  estado: { type: String, enum: ['solicitado', 'revisado', 'atendido'], default: 'solicitado' },
  evidencia: {
    data: String, // base64
    filename: String,
    mimetype: String,
    size: Number
  },
  atendido_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona' },
  fecha_atencion: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('RequerimientoAula', RequerimientoAulaSchema);