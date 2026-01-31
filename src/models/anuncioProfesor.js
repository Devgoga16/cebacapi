const mongoose = require('mongoose');

const AnuncioProfesorSchema = new mongoose.Schema({
  id_profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true
  },
  id_aula: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Aula',
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    trim: true,
    default: '#3B82F6' // azul por defecto
  },
  fecha_publicacion: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'anunciosprofesor',
  timestamps: true
});

// Índices para consultas frecuentes
AnuncioProfesorSchema.index({ id_aula: 1, fecha_publicacion: -1 });
AnuncioProfesorSchema.index({ id_profesor: 1 });

module.exports = mongoose.model('AnuncioProfesor', AnuncioProfesorSchema);
