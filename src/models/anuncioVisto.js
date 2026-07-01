const mongoose = require('mongoose');

const AnuncioVistoSchema = new mongoose.Schema({
  persona_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  publicacion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Publicacion', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

AnuncioVistoSchema.index({ persona_id: 1, publicacion_id: 1 }, { unique: true });
AnuncioVistoSchema.index({ publicacion_id: 1 });

module.exports = mongoose.model('AnuncioVisto', AnuncioVistoSchema);
