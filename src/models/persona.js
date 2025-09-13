const mongoose = require('mongoose');

const PersonaSchema = new mongoose.Schema(
  {
    id_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    nombres: {
      type: String,
      required: true,
      trim: true,
    },
    apellido_paterno: {
      type: String,
      required: true,
      trim: true,
    },
    apellido_materno: {
      type: String,
      required: false,
      trim: true,
    },
    fono: {
      type: String,
      required: false,
      trim: true,
    },
    direccion: {
      type: String,
      required: false,
      trim: true,
    },
    fecha_nacimiento: {
      type: Date,
      required: false,
    },
    numero_documento: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    estado_civil: {
      type: String,
      enum: ['Soltero', 'Casado', 'Divorciado', 'Viudo', 'Otro'],
      required: false,
    },
    fecha_bautismo: {
      type: Date,
      required: false,
    },
    fecha_conversion: {
      type: Date,
      required: false,
    },
    id_ministerio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ministerio',
      required: false,
    },
    otra_denominacion: {
      type: String,
      trim: true,
    }
  },
  {
    collection: 'personas',
    timestamps: true,
  }
);

module.exports = mongoose.model('Persona', PersonaSchema);
