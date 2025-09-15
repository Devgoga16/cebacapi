// Simula la validación de cuenta
exports.validarUsuario = async (id) => {
  const usuario = await Usuario.findByIdAndUpdate(id, { validado: true }, { new: true });
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }
  return {
    message: 'Cuenta activa correctamente, ya eres parte del CEBAC',
    usuario: {
      _id: usuario._id,
      username: usuario.username,
      validado: usuario.validado,
    }
  };
};
const Usuario = require('../models/usuario');
const Persona = require('../models/persona');
const Rol = require('../models/rol');
const bcrypt = require('bcrypt');
const axios = require('axios');

// Helper: envía correo de validación (no bloqueante: errores se registran y no rompen la creación)
async function sendValidationEmail(to, iduser) {
  if (!to || !iduser) return;
  const payload = {
    to,
    validationUrl: `http://localhost:3000/cuenta/activar/${iduser}`,
  };
  try {
    await axios.post('https://unify-mail.onrender.com/send', payload, { timeout: 8000 });
  } catch (err) {
    console.error('No se pudo enviar el correo de validación:', err?.message || err);
  }
}

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
    // Validaciones básicas
    if (!userData || !userData.username || !userData.password) {
      const err = new Error('username y password son requeridos');
      err.statusCode = 400;
      throw err;
    }
    // Unicidad de username
    const existing = await Usuario.findOne({ username: userData.username });
    if (existing) {
      const err = new Error('El nombre de usuario ya está en uso');
      err.statusCode = 400;
      throw err;
    }

  // Incluir rol por defecto "estudiante"
  const rolEstudiante = await Rol.findOne({ nombre_rol: { $regex: /^estudiante$/i } });
  if (!rolEstudiante) {
    const err = new Error("No se encontró el rol por defecto 'estudiante'");
    err.statusCode = 400;
    throw err;
  }
  // Forzamos rol por defecto y no aceptamos roles del payload para este endpoint
  userData.roles = [rolEstudiante._id];

  // Si se proporcionó id_persona, validar que exista y que no tenga ya un usuario asignado
  let personaEmail = null;
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
    personaEmail = persona.email || null;
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

  // Enviar correo de validación (si tenemos email)
  if (personaEmail) {
    await sendValidationEmail(personaEmail, saved._id);
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

// Crea Usuario y luego Persona enlazada (id_user) sin exigir id_persona en usuario
exports.createUsuarioYPersona = async (payload) => {
  const { usuario: usuarioInput, persona: personaInput } = payload || {};
  if (!usuarioInput || !personaInput) {
    const err = new Error('Debe enviar los objetos usuario y persona');
    err.statusCode = 400;
    throw err;
  }

  // Validaciones básicas de usuario
  const { username, password } = usuarioInput;
  if (!username || !password) {
    const err = new Error('username y password son requeridos');
    err.statusCode = 400;
    throw err;
  }
  const exists = await Usuario.findOne({ username });
  if (exists) {
    const err = new Error('El nombre de usuario ya está en uso');
    err.statusCode = 400;
    throw err;
  }

  // Incluir rol por defecto "estudiante"
  const rolEst = await Rol.findOne({ nombre_rol: { $regex: /^estudiante$/i } });
  if (!rolEst) {
    const err = new Error("No se encontró el rol por defecto 'estudiante'");
    err.statusCode = 400;
    throw err;
  }
  // Rol por defecto únicamente en creación combinada
  const rolesToSave = [rolEst._id];

  // Hash de contraseña
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  // 1) Crear Usuario
  const createdUsuario = await new Usuario({ username, password: hashed, roles: rolesToSave }).save();

  try {
    // 2) Crear Persona con id_user ya asignado
    const PersonaModel = require('../models/persona');
    const personaData = { ...personaInput, id_user: createdUsuario._id };
    const personaDoc = new PersonaModel(personaData);
  const createdPersona = await personaDoc.save();

  // Enviar correo de validación
  await sendValidationEmail(createdPersona.email, createdUsuario._id);

  return { usuario: createdUsuario, persona: createdPersona };
  } catch (err) {
    // Rollback: si falla la creación de Persona, eliminamos el Usuario creado
    await Usuario.findByIdAndDelete(createdUsuario._id).catch(() => {});
    throw err;
  }
};