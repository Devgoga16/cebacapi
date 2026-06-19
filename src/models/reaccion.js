const mongoose = require('mongoose');

const TIPOS_REACCION = ['me_gusta', 'me_encanta', 'me_asombra', 'me_bendice'];
const TIPOS_ENTIDAD = ['AnuncioProfesor', 'Anuncio'];

const ReaccionSchema = new mongoose.Schema(
  {
    tipo_entidad: {
      type: String,
      enum: TIPOS_ENTIDAD,
      required: true,
    },
    id_anuncio: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    id_usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Persona',
      required: true,
    },
    reaccion: {
      type: String,
      enum: TIPOS_REACCION,
      required: true,
    },
  },
  {
    collection: 'reacciones',
    timestamps: true,
  }
);

// Un usuario solo puede tener UNA reacción activa por anuncio
ReaccionSchema.index({ tipo_entidad: 1, id_anuncio: 1, id_usuario: 1 }, { unique: true });

module.exports = mongoose.model('Reaccion', ReaccionSchema);
module.exports.TIPOS_REACCION = TIPOS_REACCION;
module.exports.TIPOS_ENTIDAD = TIPOS_ENTIDAD;
