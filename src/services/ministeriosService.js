const Ministerio = require('../models/ministerio');

exports.getAllMinisterios = async () => {
  return await Ministerio.find().populate('id_iglesia');
};

exports.getMinisterioById = async (id) => {
  return await Ministerio.findById(id).populate('id_iglesia');
};

exports.getMinisteriosByIglesia = async (id_iglesia) => {
  return await Ministerio.find({ id_iglesia }).populate('id_iglesia');
};

exports.createMinisterio = async (data) => {
  const ministerio = new Ministerio(data);
  return await ministerio.save();
};

exports.updateMinisterio = async (id, data) => {
  return await Ministerio.findByIdAndUpdate(id, data, { new: true }).populate('id_iglesia');
};

exports.deleteMinisterio = async (id) => {
  const result = await Ministerio.findByIdAndDelete(id);
  return !!result;
};
