const mongoose = require('mongoose');

const CriterioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
}, { _id: true });

const GrupoEvaluacionSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  criterios: { type: [CriterioSchema], default: [] },
  activo: { type: Boolean, default: true },
}, {
  collection: 'grupos_evaluacion',
  timestamps: true,
});

module.exports = mongoose.model('GrupoEvaluacion', GrupoEvaluacionSchema);
