const CategoriaAnuncio = require('../models/categoriaanuncio');

exports.getAllCategoriaAnuncios = async () => {
  return await CategoriaAnuncio.find();
};

exports.getCategoriaAnuncioById = async (id) => {
  return await CategoriaAnuncio.findById(id);
};

exports.createCategoriaAnuncio = async (data) => {
  const categoria = new CategoriaAnuncio(data);
  return await categoria.save();
};

exports.updateCategoriaAnuncio = async (id, data) => {
  return await CategoriaAnuncio.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteCategoriaAnuncio = async (id) => {
  const result = await CategoriaAnuncio.findByIdAndDelete(id);
  return !!result;
};
