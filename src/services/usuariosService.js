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
    // Validaciones básicas
    if (!data || !data.username || !data.password) {
      const err = new Error('username y password son requeridos');
      err.statusCode = 400;
      throw err;
    }
    // Unicidad de username
    const existing = await Usuario.findOne({ username: data.username });
    if (existing) {
      const err = new Error('El nombre de usuario ya está en uso');
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

// Crea Usuario y luego Persona enlazada (id_user) sin exigir id_persona en usuario
exports.createUsuarioYPersona = async (payload) => {
  const { usuario: usuarioInput, persona: personaInput } = payload || {};
  if (!usuarioInput || !personaInput) {
    const err = new Error('Debe enviar los objetos usuario y persona');
    err.statusCode = 400;
    throw err;
  }

  // Validaciones básicas de usuario
  const { username, password, roles } = usuarioInput;
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

  // Hash de contraseña
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  // 1) Crear Usuario
  const createdUsuario = await new Usuario({ username, password: hashed, roles }).save();

  try {
    // 2) Crear Persona con id_user ya asignado
    const PersonaModel = require('../models/persona');
    const personaData = { ...personaInput, id_user: createdUsuario._id };
    const personaDoc = new PersonaModel(personaData);
    const createdPersona = await personaDoc.save();

    return { usuario: createdUsuario, persona: createdPersona };
  } catch (err) {
    // Rollback: si falla la creación de Persona, eliminamos el Usuario creado
    await Usuario.findByIdAndDelete(createdUsuario._id).catch(() => {});
    throw err;
  }
};