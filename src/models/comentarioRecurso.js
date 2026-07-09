const mongoose = require('mongoose');

const ComentarioRecursoSchema = new mongoose.Schema(
  {
    id_recurso: { type: mongoose.Schema.Types.ObjectId, ref: 'Recurso', required: true },
    autor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    autor_nombre: { type: String, required: true, trim: true },
    autor_rol: { type: String, enum: ['Estudiante', 'Docente', 'Coordinador', 'Admin'], required: true },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ComentarioRecurso', default: null },
    texto: { type: String, required: true, trim: true, maxlength: 1000 },
    eliminado: { type: Boolean, default: false },
  },
  { collection: 'comentarios_recurso', timestamps: true },
);

ComentarioRecursoSchema.index({ id_recurso: 1, createdAt: 1 });

module.exports = mongoose.model('ComentarioRecurso', ComentarioRecursoSchema);
