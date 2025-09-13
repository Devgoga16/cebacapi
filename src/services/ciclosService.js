const Ciclo = require('../models/ciclo');
const Aula = require('../models/aula');

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
  // Verificar si existen aulas asociadas a este ciclo
  const aulasAsociadas = await Aula.countDocuments({ id_ciclo: id });
  if (aulasAsociadas > 0) {
    const err = new Error(`No se puede eliminar el ciclo porque existen ${aulasAsociadas} aula(s) asociadas.`);
    err.statusCode = 400; // Regla de negocio
    throw err;
  }

  const result = await Ciclo.findByIdAndDelete(id);
  return !!result;
};
