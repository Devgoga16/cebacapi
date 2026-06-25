const mongoose = require('mongoose');

const PenaCalificacionSchema = new mongoose.Schema(
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
    leccion: {
      type: String,
      required: true,
      trim: true
    },
    seccion: {
      type: String,
      required: true,
      trim: true
    },
    nota: {
      type: Number,
      required: true,
      min: 0,
      max: 20
    },
    comentario: {
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
    collection: 'pena_calificaciones',
    timestamps: true,
  }
);

// Un registro por alumno/aula/leccion/seccion
PenaCalificacionSchema.index({ id_aula: 1, id_alumno: 1, leccion: 1, seccion: 1 }, { unique: true });

// Consultas por aula + lección
PenaCalificacionSchema.index({ id_aula: 1, leccion: 1 });

module.exports = mongoose.model('PenaCalificacion', PenaCalificacionSchema);
