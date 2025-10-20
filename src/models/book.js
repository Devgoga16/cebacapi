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
  }
}, {
  collection: 'books',
  timestamps: true
});

module.exports = mongoose.model('Book', BookSchema);