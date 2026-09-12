const mongoose = require('mongoose');

const CalificacionSchema = new mongoose.Schema({
  id_grupo: { type: mongoose.Schema.Types.ObjectId, ref: 'GrupoEvaluacion', required: true },
  criterio: { type: String, required: true },
  puntuacion: { type: Number, required: true, min: 1, max: 5 },
}, { _id: false });

const EvaluacionDocenteSchema = new mongoose.Schema({
  id_aula: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', required: true },
  id_alumno: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  calificaciones: { type: [CalificacionSchema], required: true },
  comentario: { type: String, trim: true, default: '' },
}, {
  collection: 'evaluaciones_docente',
  timestamps: true,
});

EvaluacionDocenteSchema.index({ id_aula: 1, id_alumno: 1 }, { unique: true });

module.exports = mongoose.model('EvaluacionDocente', EvaluacionDocenteSchema);
