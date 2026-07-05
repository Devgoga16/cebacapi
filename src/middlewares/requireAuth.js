const { verificarToken } = require('../utils/jwt');

// Rutas que deben quedar accesibles sin sesión (login, activación de cuenta
// por enlace de correo, health check y documentación). Se comparan como
// prefijo para cubrir tanto el montaje en raíz como bajo /api.
const PREFIJOS_PUBLICOS = [
  '/login',
  '/api/login',
  '/cuenta/activar/',
  '/api/cuenta/activar/',
  '/health',
  '/api-docs',
  '/api/api-docs',
  '/status',
  '/api/status',
  '/iglesias/con-ministerios'
];

function esRutaPublica(path) {
  return PREFIJOS_PUBLICOS.some((prefijo) => path.startsWith(prefijo));
}

/**
 * A diferencia de extractActor (que solo identifica al actor para auditoría
 * y NUNCA bloquea), este middleware corta la request con 401 si no hay un
 * JWT válido. Debe montarse después de extractActor y antes de las rutas
 * protegidas (que son, en la práctica, casi todas).
 */
module.exports = (req, res, next) => {
  if (esRutaPublica(req.path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      state: 'failed',
      data: null,
      message: 'No autenticado: falta el token de acceso',
      action_code: 401,
    });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const payload = verificarToken(token);
    req.usuarioToken = payload;
    req.actor = { id_usuario: payload.id_usuario || null, username: payload.username || null };
    return next();
  } catch (err) {
    return res.status(401).json({
      state: 'failed',
      data: null,
      message: 'Token inválido o expirado',
      action_code: 401,
    });
  }
};
