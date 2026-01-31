const mongoose = require('mongoose');

const TipoCalificacionSchema = new mongoose.Schema({
  id_aula: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Aula', 
    required: true 
  },
  nombre: { 
    type: String, 
    required: true,
    trim: true
  },
  porcentaje: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  descripcion: {
    type: String,
    trim: true
  },
  orden: {
    type: Number,
    default: 0
  }
}, {
  collection: 'tiposCalificacion',
  timestamps: true
});

// Índice compuesto para evitar duplicados de nombre por aula
TipoCalificacionSchema.index({ id_aula: 1, nombre: 1 }, { unique: true });

module.exports = mongoose.model('TipoCalificacion', TipoCalificacionSchema);
