const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  buyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Persona", 
    required: true 
  },
  deliveredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Persona" 
  },
  books: [{
    book: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Book", 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    unitPrice: { 
      type: Number, 
      required: true,
      min: 0
    }
  }],
  total: { 
    type: Number, 
    required: true,
    min: 0
  },
  saleDate: { 
    type: Date, 
    default: Date.now 
  },
  status: {
    type: String,
    enum: ["reservado", "pagado", "entregado"],
    default: "reservado"
  }
}, {
  collection: 'sales',
  timestamps: true
});

module.exports = mongoose.model('Sale', SaleSchema);