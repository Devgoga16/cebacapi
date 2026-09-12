const GrupoEvaluacion = require('../models/grupoEvaluacion');

exports.getAll = async () => {
  return await GrupoEvaluacion.find().sort({ createdAt: -1 });
};

exports.getActivos = async () => {
  return await GrupoEvaluacion.find({ activo: true }).sort({ nombre: 1 });
};

exports.getById = async (id) => {
  return await GrupoEvaluacion.findById(id);
};

exports.create = async (data) => {
  const grupo = new GrupoEvaluacion(data);
  return await grupo.save();
};

exports.update = async (id, data) => {
  return await GrupoEvaluacion.findByIdAndUpdate(id, data, { new: true });
};

exports.delete = async (id) => {
  const result = await GrupoEvaluacion.findByIdAndDelete(id);
  return !!result;
};
