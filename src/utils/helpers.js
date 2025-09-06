// Funciones utilitarias
function sendResponse(res, { state = 'success', data = null, message = null, action_code = 200 }) {
  res.status(action_code).json({ state, data, message, action_code });
}

module.exports = {
  sendResponse,
};
