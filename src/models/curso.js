const mongoose = require("mongoose");

const CursoSchema = new mongoose.Schema(
  {
    id_nivel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nivel",
      required: true,
    },
    nombre_curso: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    descripcion_curso: {
      type: String,
      required: false,
      trim: true,
    },
    electivo: {
      type: Boolean,
      default: false,
    },
    prerequisitos: [
      {
        tipo: {
          type: String,
          required: true,
          enum: ["Curso", "Nivel"], // define a qué colección apunta
        },
        ref_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "prerequisitos.tipo", // referencia dinámica
        },
      },
    ],
    sesiones: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    collection: "cursos",
    timestamps: true,
  }
);

module.exports = mongoose.model("Curso", CursoSchema);
