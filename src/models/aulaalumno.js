const mongoose = require('mongoose');

const AulaAlumnoSchema = new mongoose.Schema({
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
  estado: {
    type: String,
    enum: ['aprobado', 'reprobado', 'en curso', 'retirado'],
    default: 'en curso'
  }
}, {
  collection: 'aulaalumnos',
  timestamps: true
});

module.exports = mongoose.model('AulaAlumno', AulaAlumnoSchema);
