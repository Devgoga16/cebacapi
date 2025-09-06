const rolesService = require('../services/rolesService');

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await rolesService.getAllRoles();
    res.json({ state: 'success', data: roles, message: 'Éxito al traer todos los roles', action_code: null });
  } catch (err) {
    next(err);
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const role = await rolesService.getRoleById(req.params.id);
    if (!role) return res.status(404).json({ state: 'failed', data: null, message: 'Rol no encontrado', action_code: 404 });
    res.json({ state: 'success', data: role, message: null, action_code: 200 });
  } catch (err) {
    next(err);
  }
};

exports.createRole = async (req, res) => {
  try {
    const newRole = await rolesService.createRole(req.body);
    res.status(201).json({ state: 'success', data: newRole, message: 'Rol creado', action_code: 201 });
  } catch (err) {
    next(err);
  }
};

exports.updateRole = async (req, res) => {
  try {
    const updatedRole = await rolesService.updateRole(req.params.id, req.body);
    if (!updatedRole) return res.status(404).json({ state: 'failed', data: null, message: 'Rol no encontrado', action_code: 404 });
    res.json({ state: 'success', data: updatedRole, message: 'Rol actualizado', action_code: 200 });
  } catch (err) {
    next(err);
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const deleted = await rolesService.deleteRole(req.params.id);
    if (!deleted) return res.status(404).json({ state: 'failed', data: null, message: 'Rol no encontrado', action_code: 404 });
    res.json({ state: 'success', data: null, message: 'Rol eliminado', action_code: 200 });
  } catch (err) {
    next(err);
  }
};
