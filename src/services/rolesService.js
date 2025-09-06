const Rol = require('../models/rol');

exports.getAllRoles = async () => {
  return await Rol.find();
};

exports.getRoleById = async (id) => {
  return await Rol.findById(id);
};

exports.createRole = async (data) => {
  const role = new Rol(data);
  return await role.save();
};

exports.updateRole = async (id, data) => {
    let encontrado = await Rol.findOne({ id_rol: id });
  return await Rol.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteRole = async (id) => {
  const result = await Rol.findByIdAndDelete(id);
  return !!result;
};
