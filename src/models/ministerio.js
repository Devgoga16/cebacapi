const mongoose = require('mongoose');

const MinisterioSchema = new mongoose.Schema(
  {
    nombre_encargado: {
      type: String,
      required: true,
      trim: true,
    },
    nombre_ministerio: {
      type: String,
      required: true,
      trim: true,
    },
    id_iglesia: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Iglesia',
      required: true,
    },
  },
  {
    collection: 'ministerios',
    timestamps: true,
  }
);

module.exports = mongoose.model('Ministerio', MinisterioSchema);
