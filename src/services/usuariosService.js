const Usuario = require('../models/usuario');
const Persona = require('../models/persona');
const bcrypt = require('bcrypt');

exports.getAllUsuarios = async () => {
  return await Usuario.find().populate("roles");
};

exports.getUsuarioById = async (id) => {
  return await Usuario.findById(id);
};

exports.createUsuario = async (data) => {
  // Extraemos id_persona para enlazar luego y evitamos que entre al documento de Usuario
  const { id_persona, ...userData } = data;

  // id_persona es obligatorio para crear un usuario
  if (!id_persona) {
    const err = new Error('id_persona es requerido para crear un usuario');
    err.statusCode = 400;
    throw err;
  }

  // Si se proporcionó id_persona, validar que exista y que no tenga ya un usuario asignado
  if (id_persona) {
    const persona = await Persona.findById(id_persona);
    if (!persona) {
      const err = new Error('La persona indicada no existe');
      err.statusCode = 400;
      throw err;
    }
    if (persona.id_user) {
      const err = new Error('La persona ya tiene un usuario asignado');
      err.statusCode = 400;
      throw err;
    }
  }

  // Hash de contraseña si viene
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }

  // Crear usuario
  const usuario = new Usuario(userData);
  const saved = await usuario.save();

  // Enlazar persona <- usuario recién creado
  if (id_persona) {
    await Persona.findByIdAndUpdate(id_persona, { id_user: saved._id }, { new: true });
  }

  return saved;
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