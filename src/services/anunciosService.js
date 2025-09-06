const Anuncio = require('../models/anuncio');

exports.getAllAnuncios = async () => {
  return await Anuncio.find().populate('id_categoria_anuncio roles id_publicador');
};

exports.getAnuncioById = async (id) => {
  return await Anuncio.findById(id).populate('id_categoria_anuncio roles id_publicador');
};

exports.createAnuncio = async (data) => {
  const anuncio = new Anuncio(data);
  return await anuncio.save();
};

exports.updateAnuncio = async (id, data) => {
  return await Anuncio.findByIdAndUpdate(id, data, { new: true }).populate('id_categoria_anuncio roles id_publicador');
};

exports.deleteAnuncio = async (id) => {
  const result = await Anuncio.findByIdAndDelete(id);
  return !!result;
};
