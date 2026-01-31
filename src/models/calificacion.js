const mongoose = require('mongoose');

const CalificacionSchema = new mongoose.Schema(
  {
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
    id_tipo_calificacion: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'TipoCalificacion', 
      required: true 
    },
    nota: { 
      type: Number, 
      required: true,
      min: 0,
      max: 100
    },
    observacion: { 
      type: String, 
      required: false, 
      trim: true 
    },
    registrado_por: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Persona', 
      required: false 
    },
  },
  {
    collection: 'calificaciones',
    timestamps: true,
  }
);

// Un registro por alumno/aula/tipo de calificación
CalificacionSchema.index({ id_aula: 1, id_alumno: 1, id_tipo_calificacion: 1 }, { unique: true });

// Índice para consultas rápidas por aula
CalificacionSchema.index({ id_aula: 1 });

// Índice para consultas por alumno
CalificacionSchema.index({ id_alumno: 1 });

module.exports = mongoose.model('Calificacion', CalificacionSchema);
