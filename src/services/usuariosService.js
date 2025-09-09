const Usuario = require('../models/usuario');
const bcrypt = require('bcrypt');

exports.getAllUsuarios = async () => {
  return await Usuario.find().populate("roles");
};

exports.getUsuarioById = async (id) => {
  return await Usuario.findById(id);
};

exports.createUsuario = async (data) => {
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
  }
  const usuario = new Usuario(data);
  return await usuario.save();
};

exports.updateUsuario = async (id, data) => {
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
  }
  return await Usuario.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteUsuario = async (id) => {
  const result = await Usuario.findByIdAndDelete(id);
  return !!result;
};