const mongoose = require('mongoose');

const InscripcionSchema = new mongoose.Schema({
  id_aula: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aula',
    required: true
  },
  id_alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  },
  fecha_inscripcion: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Aceptado', 'Rechazado'],
    default: 'Pendiente'
  },
  observacion: {
    type: String,
    default: ''
  }
}, {
  collection: 'inscripciones',
  timestamps: true
});

module.exports = mongoose.model('Inscripcion', InscripcionSchema);
