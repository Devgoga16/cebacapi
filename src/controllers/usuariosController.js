const usuariosService = require('../services/usuariosService');

exports.getAllUsuarios = async (req, res, next) => {
  try {
    const usuarios = await usuariosService.getAllUsuarios();
    res.json({ state: 'success', data: usuarios, message: 'Éxito al traer todos los usuarios', action_code: null
     });
  } catch (err) {
    next(err);
  }
};

exports.getUsuarioById = async (req, res, next) => {
  try {
    const usuario = await usuariosService.getUsuarioById(req.params.id);
    if (!usuario) return res.status(404).json({ state: 'failed', data: null, message: 'Usuario no encontrado', action_code: 404 });
    res.json({ state: 'success', data: usuario, message: null, action_code: 200 });
  } catch (err) {
    next(err);
  }
};

exports.createUsuario = async (req, res, next) => {
  try {
    const newUsuario = await usuariosService.createUsuario(req.body);
    res.status(201).json({ state: 'success', data: newUsuario, message: 'Usuario creado', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateUsuario = async (req, res, next) => {
  try {
    const updatedUsuario = await usuariosService.updateUsuario(req.params.id, req.body);
    if (!updatedUsuario) return res.status(404).json({ state: 'failed', data: null, message: 'Usuario no encontrado', action_code: 404 });
    res.json({ state: 'success', data: updatedUsuario, message: 'Usuario actualizado', action_code: 200 });
  } catch (err) {
    next(err);
  }
};

exports.deleteUsuario = async (req, res, next) => {
  try {
    const deleted = await usuariosService.deleteUsuario(req.params.id);
    if (!deleted) return res.status(404).json({ state: 'failed', data: null, message: 'Usuario no encontrado', action_code: 404 });
    res.json({ state: 'success', data: null, message: 'Usuario eliminado', action_code: 200 });
  } catch (err) {
    next(err);
  }
};
