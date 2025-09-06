const Nivel = require('../models/nivel');

exports.getAllNiveles = async () => {
  return await Nivel.find();
};

exports.getNivelById = async (id) => {
  return await Nivel.findById(id);
};

exports.createNivel = async (data) => {
  const nivel = new Nivel(data);
  return await nivel.save();
};

exports.updateNivel = async (id, data) => {
  return await Nivel.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteNivel = async (id) => {
  const result = await Nivel.findByIdAndDelete(id);
  return !!result;
};
