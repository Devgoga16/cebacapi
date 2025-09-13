const Iglesia = require('../models/iglesia');
const Ministerio = require('../models/ministerio');

exports.getAllIglesias = async () => {
  return await Iglesia.find();
};

exports.getIglesiaById = async (id) => {
  return await Iglesia.findById(id);
};

exports.createIglesia = async (data) => {
  const iglesia = new Iglesia(data);
  return await iglesia.save();
};

exports.updateIglesia = async (id, data) => {
  return await Iglesia.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteIglesia = async (id) => {
  // Verificar dependencias: ministerios asociados a esta iglesia
  const ministeriosAsociados = await Ministerio.countDocuments({ id_iglesia: id });
  if (ministeriosAsociados > 0) {
    const err = new Error(`No se puede eliminar la iglesia porque existen ${ministeriosAsociados} ministerio(s) asociados.`);
    err.statusCode = 400; // Regla de negocio
    throw err;
  }

  const result = await Iglesia.findByIdAndDelete(id);
  return !!result;
};
