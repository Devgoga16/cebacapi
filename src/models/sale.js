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
  paymentMethod: {
    type: String,
    enum: ["efectivo", "transferencia", "yape"],
    required: true
  },
  voucher: {
    id: { type: String },
    url: { type: String },
    display_url: { type: String },
    thumb_url: { type: String },
    medium_url: { type: String },
    original_filename: { type: String },
    upload_date: { type: Date },
    validation_status: {
      type: String,
      enum: ["pendiente", "aprobado", "rechazado"],
      default: "pendiente"
    },
    validated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Persona"
    },
    validated_at: { type: Date },
    rejection_reason: { type: String, trim: true }
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