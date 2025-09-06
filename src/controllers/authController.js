const authService = require('../services/authService');
const { sendResponse } = require('../utils/helpers');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login(username, password);
    if (!result) {
      return sendResponse(res, { state: 'failed', data: null, message: 'Credenciales inválidas', action_code: 401 });
    }
    sendResponse(res, { data: result, message: 'Login exitoso' });
  } catch (err) {
    next(err);
  }
};
