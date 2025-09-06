const mongoose = require('mongoose');

const AulaSchema = new mongoose.Schema({
  es_presencial: { type: Boolean, required: true },
  id_profesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  id_curso: { type: mongoose.Schema.Types.ObjectId, ref: 'Curso', required: true },
  dia: { type: String, required: true },
  hora_inicio: { type: String, required: true },
  hora_fin: { type: String, required: true },
  aforo: { type: Number, required: true },
  id_ciclo: { type: mongoose.Schema.Types.ObjectId, ref: 'Ciclo', required: true },
  fecha_inicio: { type: Date, required: true },
  fecha_fin: { type: Date, required: true }
}, {
  collection: 'aulas',
  timestamps: true
});

module.exports = mongoose.model('Aula', AulaSchema);
