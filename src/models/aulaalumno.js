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
    enum: ['aprobado', 'reprobado', 'en curso', 'retirado', 'inscrito', 'pendiente'],
    default: 'en curso'
  },
  carta_pastoral: {
    data: {
      type: String, // base64
      required: false,
    },
    filename: { type: String, required: false, trim: true },
    mimetype: { type: String, required: false, trim: true },
    size: { type: Number, required: false }, // en bytes
  }
}, {
  collection: 'aulaalumnos',
  timestamps: true
});

module.exports = mongoose.model('AulaAlumno', AulaAlumnoSchema);
