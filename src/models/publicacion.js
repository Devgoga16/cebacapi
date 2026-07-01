const mongoose = require('mongoose');

const ArchivoSchema = new mongoose.Schema({
  data: { type: String },       // base64
  filename: { type: String },
  mimetype: { type: String },
  size: { type: Number },
}, { _id: false });

const ROLES_PUBLICACION = ['Admin', 'Coordinador', 'Docente', 'Estudiante'];

const FORMATOS_PUBLICACION = ['publicacion', 'anuncio'];

const TIPOS_VISIBILIDAD = [
  'roles_globales',        // Admin → por rol (roles_destino indica cuáles)
  'coordinadores_global',  // Coordinador → entre coordinadores
  'mis_docentes',          // Coordinador → sus docentes a cargo
  'mis_estudiantes_coord', // Coordinador → estudiantes de sus aulas
  'docentes_global',       // Docente → entre todos los docentes
  'mis_estudiantes',       // Docente → todos sus estudiantes
  'aula_especifica',       // Docente → estudiantes de un aula concreta
  'estudiantes_global',    // Estudiante → todos los estudiantes
  'mi_aula',               // Estudiante → compañeros de aula
];

const PublicacionSchema = new mongoose.Schema({
  autor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  autor_rol: { type: String, enum: ROLES_PUBLICACION, required: true },
  formato: { type: String, enum: FORMATOS_PUBLICACION, default: 'publicacion' },
  contenido: { type: String, default: '' },
  archivos: [ArchivoSchema],
  visibilidad: {
    tipo: { type: String, enum: TIPOS_VISIBILIDAD, required: true },
    roles_destino: [{ type: String }],                                             // para roles_globales
    aulas_destino: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Aula' }],        // para aula_especifica
    label: { type: String },                                                        // texto legible
  },
  // Para visibilidad relacional (mis_docentes, mis_estudiantes*, aula_especifica, mi_aula)
  // se pre-computan los IDs de Persona que pueden ver esta publicación.
  // Para visibilidad por rol global se evalúa en tiempo de consulta.
  destinatarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Persona' }],
}, {
  collection: 'publicaciones',
  timestamps: true,
});

PublicacionSchema.index({ autor_id: 1, createdAt: -1 });
PublicacionSchema.index({ destinatarios: 1, createdAt: -1 });
PublicacionSchema.index({ 'visibilidad.tipo': 1, createdAt: -1 });
PublicacionSchema.index({ 'visibilidad.roles_destino': 1, createdAt: -1 });

module.exports = mongoose.model('Publicacion', PublicacionSchema);
module.exports.ROLES_PUBLICACION = ROLES_PUBLICACION;
module.exports.TIPOS_VISIBILIDAD = TIPOS_VISIBILIDAD;
module.exports.FORMATOS_PUBLICACION = FORMATOS_PUBLICACION;
