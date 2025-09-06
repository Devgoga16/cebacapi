const Usuario = require('../models/usuario');
const Persona = require('../models/persona');
const Rol = require('../models/rol');

exports.login = async (username, password) => {
  // Buscar usuario por username
  const usuario = await Usuario.findOne({ username });
  if (!usuario) return null;

  // Verificar password en texto plano
  if (usuario.password !== password) return null;

  // Traer datos de persona
  const persona = await Persona.findOne({ id_user: usuario._id });

  // Traer roles
  const roles = await Rol.find({ _id: { $in: usuario.roles } });

  // Retornar datos completos
  return {
    usuario: {
      _id: usuario._id,
      username: usuario.username,
      roles: usuario.roles,
    },
    persona,
    roles,
  };
};
