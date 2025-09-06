const mongoose = require('mongoose');

const NivelSchema = new mongoose.Schema(
  {
    nombre_nivel: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    collection: 'niveles',
    timestamps: true,
  }
);

module.exports = mongoose.model('Nivel', NivelSchema);
