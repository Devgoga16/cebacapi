const mongoose = require('mongoose');

const PersonaSchema = new mongoose.Schema(
  {
    id_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: false,
    },
    nombres: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    apellido_paterno: {
      type: String,
      required: true,
      trim: true,
    },
    apellido_materno: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
    },
    direccion: {
      type: String,
      required: true,
      trim: true,
    },
    fecha_nacimiento: {
      type: Date,
      required: true,
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
      required: true,
    },
    fecha_bautismo: {
      type: Date,
      required: true,
    },
    fecha_conversion: {
      type: Date,
      required: true,
    },
    id_ministerio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ministerio',
      required: false,
    },
    otra_denominacion: {
      type: String,
      required: false,
      trim: true,
    },
    imagen: {
      data: {
        type: String, // base64
        required: false,
      },
      // Puedes agregar metadatos opcionales si lo necesitas
      filename: { type: String, required: false, trim: true },
      mimetype: { type: String, required: false, trim: true },
      size: { type: Number, required: false }, // en bytes
    }
  },
  {
    collection: 'personas',
    timestamps: true,
  }
);

module.exports = mongoose.model('Persona', PersonaSchema);
