const mongoose = require("mongoose");

const UsuarioSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rol", // el nombre del modelo de tu colección roles
      },
    ],
    permissions: [
      {
        type: String,
        trim: true,
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
    validado: {
      type: Boolean,
      default: true,
    },
    last_login: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "usuarios",
    timestamps: true,
  }
);

module.exports = mongoose.model("Usuario", UsuarioSchema);
