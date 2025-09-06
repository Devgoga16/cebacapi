const mongoose = require('mongoose');

const CategoriaAnuncioSchema = new mongoose.Schema(
  {
    nombre_categoria: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    icono: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    collection: 'categoriaanuncios',
    timestamps: true,
  }
);

module.exports = mongoose.model('CategoriaAnuncio', CategoriaAnuncioSchema);
