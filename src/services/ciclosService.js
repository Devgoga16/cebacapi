const Ciclo = require('../models/ciclo');

exports.getAllCiclos = async () => {
  return await Ciclo.find();
};

exports.getCicloById = async (id) => {
  return await Ciclo.findById(id);
};

exports.createCiclo = async (data) => {
  const ciclo = new Ciclo(data);
  return await ciclo.save();
};

exports.updateCiclo = async (id, data) => {
  return await Ciclo.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteCiclo = async (id) => {
  const result = await Ciclo.findByIdAndDelete(id);
  return !!result;
};
