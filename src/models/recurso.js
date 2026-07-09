const mongoose = require('mongoose');

const RecursoSchema = new mongoose.Schema(
  {
    id_aula: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', required: true },
    subido_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    tipo: { type: String, enum: ['archivo', 'link'], required: true },
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '', trim: true },

    // Solo cuando tipo='archivo'
    archivo: {
      key: { type: String },          // clave en R2
      filename: { type: String },     // nombre original
      mimetype: { type: String },
      size: { type: Number },         // bytes
    },

    // Solo cuando tipo='link'
    url: { type: String, trim: true },
    url_thumbnail: { type: String },  // thumbnail de YouTube extraído automáticamente
  },
  { collection: 'recursos', timestamps: true },
);

RecursoSchema.index({ id_aula: 1, createdAt: -1 });

module.exports = mongoose.model('Recurso', RecursoSchema);
