const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  author: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    default: '',
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  stock: { 
    type: Number, 
    default: 0,
    min: 0
  },
  image: {
    id: { type: String }, // ID de la imagen en Chevereto
    url: { type: String }, // URL completa de la imagen
    display_url: { type: String }, // URL de visualización
    thumb_url: { type: String }, // URL del thumbnail
    medium_url: { type: String }, // URL tamaño medio
    original_filename: { type: String }, // Nombre original del archivo
    upload_date: { type: Date } // Fecha de subida
  }
}, {
  collection: 'books',
  timestamps: true
});

module.exports = mongoose.model('Book', BookSchema);