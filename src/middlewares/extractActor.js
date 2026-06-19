const { verificarToken } = require('../utils/jwt');

/**
 * Extrae el actor (usuario que ejecuta la acción) para auditoría.
 * Prioridad:
 *   1) Token JWT en el header Authorization: Bearer <token>
 *   2) Headers legacy x-usuario-id / x-username (fallback mientras el frontend migra a JWT)
 * Resultado expuesto en req.actor = { id_usuario, username } y req.usuarioToken con el payload completo.
 */
module.exports = (req, _res, next) => {
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length).trim();
    try {
      const payload = verificarToken(token);
      req.usuarioToken = payload;
      req.actor = {
        id_usuario: payload.id_usuario || null,
        username: payload.username || null,
      };
      return next();
    } catch (err) {
      // Token presente pero inválido/expirado: no se interrumpe la request,
      // simplemente no se puede identificar al actor de forma confiable.
      req.actor = { id_usuario: null, username: null };
      return next();
    }
  }

  // Fallback legacy (deprecado): headers manuales
  req.actor = {
    id_usuario: req.headers['x-usuario-id'] || null,
    username: req.headers['x-username'] || null,
  };
  next();
};
