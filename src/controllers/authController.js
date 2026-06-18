const authService = require('../services/authService');
const { sendResponse } = require('../utils/helpers');
const audit = require('../services/auditService');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    if (!result) {
      audit.registrar({
        accion: 'AUTH_LOGIN_FALLIDO',
        entidad: 'Usuario',
        actor: { id_usuario: null, username },
        descripcion: `Intento de login fallido para usuario "${username}"`,
        ip: req.ip,
        user_agent: req.headers['user-agent'],
      });
      return sendResponse(res, { state: 'failed', data: null, message: 'Credenciales inválidas', action_code: 401 });
    }
    audit.registrar({
      accion: 'AUTH_LOGIN',
      entidad: 'Usuario',
      id_entidad: result.usuario?._id?.toString(),
      actor: { id_usuario: result.usuario?._id?.toString(), username: result.usuario?.username },
      descripcion: `Usuario "${result.usuario?.username}" inició sesión`,
      ip: req.ip,
      user_agent: req.headers['user-agent'],
    });
    sendResponse(res, { data: result, message: 'Login exitoso' });
  } catch (err) {
    next(err);
  }
};
