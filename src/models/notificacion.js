const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema(
  {
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Persona',
      required: true,
      index: true,
    },
    tipo: {
      type: String,
      required: true,
      // ej: 'ANUNCIO_PROFESOR', 'INSCRIPCION_APROBADA', 'REQUERIMIENTO_ATENDIDO'
    },
    referencia_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      // id de la entidad relacionada (ej: id del anuncio)
    },
    tipo_entidad: {
      type: String,
      enum: ['AnuncioProfesor', 'Anuncio', null],
      default: null,
      // a qué colección pertenece "referencia_id". Indispensable cuando "tipo" es ambiguo
      // (ej: 'REACCION_ANUNCIO' puede originarse tanto en AnuncioProfesor como en Anuncio).
    },
    id_aula: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Aula',
      default: null,
      // solo aplica cuando tipo = 'ANUNCIO_PROFESOR'
    },
    titulo: { type: String, required: true, trim: true },
    mensaje: { type: String, required: true, trim: true },
    leido: { type: Boolean, default: false, index: true },
    fecha_leido: { type: Date, default: null },
  },
  {
    collection: 'notificaciones',
    timestamps: true,
  }
);

NotificacionSchema.index({ id_usuario: 1, leido: 1, createdAt: -1 });

module.exports = mongoose.model('Notificacion', NotificacionSchema);
