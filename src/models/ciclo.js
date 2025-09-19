const mongoose = require('mongoose');

const CicloSchema = new mongoose.Schema(
  {
    nombre_ciclo: {
      type: String,
      required: true,
      trim: true,
    },
    fecha_inicio: {
      type: Date,
      required: true,
    },
    fecha_fin: {
      type: Date,
      required: true,
    },
    actual: {
      type: Boolean,
      default: false,
    },
    inscripcionesabiertas: {
      type: Boolean,
      default: false,
    },
    año: {
      type: Number,
      required: true,
    },
  },
  {
    collection: 'ciclos',
    timestamps: true,
  }
);

module.exports = mongoose.model('Ciclo', CicloSchema);
