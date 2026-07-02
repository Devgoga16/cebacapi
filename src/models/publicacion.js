const mongoose = require('mongoose');

const ArchivoSchema = new mongoose.Schema({
  data: { type: String },       // base64
  filename: { type: String },
  mimetype: { type: String },
  size: { type: Number },
}, { _id: false });

const OpcionEncuestaSchema = new mongoose.Schema({
  texto: { type: String, required: true },
  votos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Persona' }],
}, { _id: false });

const EncuestaSchema = new mongoose.Schema({
  pregunta: { type: String, required: true },
  opciones: {
    type: [OpcionEncuestaSchema],
    validate: [v => v.length >= 2, 'Mínimo 2 opciones'],
  },
}, { _id: false });

const ROLES_PUBLICACION = ['Admin', 'Coordinador', 'Docente', 'Estudiante'];

const FORMATOS_PUBLICACION = ['publicacion', 'anuncio', 'encuesta'];

const TIPOS_VISIBILIDAD = [
  'roles_globales',
  'coordinadores_global',
  'mis_docentes',
  'mis_estudiantes_coord',
  'docentes_global',
  'mis_estudiantes',
  'aula_especifica',
  'estudiantes_global',
  'mi_aula',
];

const PublicacionSchema = new mongoose.Schema({
  autor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  autor_rol: { type: String, enum: ROLES_PUBLICACION, required: true },
  formato: { type: String, enum: FORMATOS_PUBLICACION, default: 'publicacion' },
  contenido: { type: String, default: '' },
  archivos: [ArchivoSchema],
  encuesta: { type: EncuestaSchema, default: null },
  fijada: { type: Boolean, default: false },
  visibilidad: {
    tipo: { type: String, enum: TIPOS_VISIBILIDAD, required: true },
    roles_destino: [{ type: String }],
    aulas_destino: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Aula' }],
    label: { type: String },
  },
  destinatarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Persona' }],
}, {
  collection: 'publicaciones',
  timestamps: true,
});

PublicacionSchema.index({ autor_id: 1, createdAt: -1 });
PublicacionSchema.index({ destinatarios: 1, createdAt: -1 });
PublicacionSchema.index({ 'visibilidad.tipo': 1, createdAt: -1 });
PublicacionSchema.index({ 'visibilidad.roles_destino': 1, createdAt: -1 });
PublicacionSchema.index({ fijada: -1, createdAt: -1 });

module.exports = mongoose.model('Publicacion', PublicacionSchema);
module.exports.ROLES_PUBLICACION = ROLES_PUBLICACION;
module.exports.TIPOS_VISIBILIDAD = TIPOS_VISIBILIDAD;
module.exports.FORMATOS_PUBLICACION = FORMATOS_PUBLICACION;
