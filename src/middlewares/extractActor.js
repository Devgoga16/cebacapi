/**
 * Extrae el actor (usuario que ejecuta la acción) del header x-usuario-id / x-username
 * y lo expone en req.actor para que los controllers lo pasen al auditService.
 */
module.exports = (req, _res, next) => {
  req.actor = {
    id_usuario: req.headers['x-usuario-id'] || null,
    username: req.headers['x-username'] || null,
  };
  next();
};
