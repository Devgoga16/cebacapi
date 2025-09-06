const Iglesia = require('../models/iglesia');

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
  const result = await Iglesia.findByIdAndDelete(id);
  return !!result;
};
