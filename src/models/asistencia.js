const mongoose = require('mongoose');

const AsistenciaSchema = new mongoose.Schema(
  {
    id_aula: { type: mongoose.Schema.Types.ObjectId, ref: 'Aula', required: true },
    tipo_persona: { type: String, enum: ['alumno', 'profesor'], required: false },
    id_alumno: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: false },
    id_profesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: false },
    // Fecha del día (normalizada a medianoche UTC de la fecha local)
    fecha: { type: Date, required: true },
    estado: { type: String, enum: ['presente', 'ausente', 'tarde', 'justificado'], required: true },
    observacion: { type: String, required: false, trim: true },
    tomado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: false },
  },
  {
    collection: 'asistencias',
    timestamps: true,
  }
);

// Un registro por alumno/aula/día
AsistenciaSchema.index({ id_aula: 1, id_alumno: 1, fecha: 1 }, { unique: true, sparse: true });
// Un registro por profesor/aula/día
AsistenciaSchema.index({ id_aula: 1, id_profesor: 1, fecha: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Asistencia', AsistenciaSchema);
