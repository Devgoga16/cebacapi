const mongoose = require('mongoose');

const AnuncioSchema = new mongoose.Schema(
  {
    id_categoria_anuncio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CategoriaAnuncio',
      required: true,
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: false,
      trim: true,
    },
    to_link: {
      type: String,
      required: false,
      trim: true,
    },
    fecha_caducidad: {
      type: Date,
      required: false,
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rol',
      }
    ],
    id_publicador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Persona',
      required: true,
    },
  },
  {
    collection: 'anuncios',
    timestamps: true,
  }
);

module.exports = mongoose.model('Anuncio', AnuncioSchema);
