const mongoose = require('mongoose');

const RolSchema = new mongoose.Schema(
  {
    nombre_rol: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: 'roles',
    timestamps: true,
  }
);

module.exports = mongoose.model('Rol', RolSchema);
