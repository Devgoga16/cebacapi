const mongoose = require('mongoose');

const IglesiaSchema = new mongoose.Schema(
  {
    nombre_iglesia: {
      type: String,
      required: true,
      trim: true,
      unique: false,
    },
  },
  {
    collection: 'iglesias',
    timestamps: true,
  }
);

module.exports = mongoose.model('Iglesia', IglesiaSchema);
