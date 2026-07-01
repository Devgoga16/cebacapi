const mongoose = require('mongoose');

const ComentarioSchema = new mongoose.Schema({
  publicacion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Publicacion', required: true },
  autor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  autor_rol: { type: String, required: true },
  contenido: { type: String, required: true, trim: true },
}, {
  collection: 'comentarios',
  timestamps: true,
});

ComentarioSchema.index({ publicacion_id: 1, createdAt: 1 });

module.exports = mongoose.model('Comentario', ComentarioSchema);
