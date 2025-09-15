// Simula la validación de cuenta
const { sendResponse } = require('../utils/helpers');
const usuariosService = require('../services/usuariosService');

exports.validarUsuario = async (req, res, next) => {
  try {
    await usuariosService.validarUsuario(req.params.iduser);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>¡Cuenta activada - Portal CEBAC!</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; background: linear-gradient(120deg, #e3f2fd 0%, #fff 100%); margin: 0; color: #222; }
    .header { background: linear-gradient(135deg, #1976d2, #1565c0); color: #fff; padding: 20px 0 36px 0; text-align: center; box-shadow: 0 2px 8px #90caf9; position: relative; overflow: hidden; }
    .brand { display: flex; align-items: center; justify-content: center; gap: 12px; }
    .icon-badge { width: 40px; height: 40px; border-radius: 50%; background: #fff; color: #1976d2; display: flex; align-items: center; justify-content: center; font-size: 1.2em; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
    .brand-title { font-weight: 700; font-size: 1.35em; letter-spacing: .3px; }
    .tagline { margin-top: 6px; font-size: .95em; opacity: .95; }
    .wave { position: absolute; bottom: -1px; left: 0; width: 100%; line-height: 0; }
    .container { max-width: 420px; margin: 16px auto 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px #bbdefb; padding: 20px 16px; }
    h1 { color: #1976d2; font-size: 1.35em; margin-bottom: 10px; font-weight: 700; }
    .user-info { background: #e3f2fd; border-radius: 8px; padding: 10px; margin: 14px 0 10px 0; color: #1565c0; font-size: 0.95em; box-shadow: 0 1px 4px #bbdefb; }
    .access-btn { display: inline-block; margin: 14px 0 0 0; padding: 8px 18px; background: #1976d2; color: #fff; font-size: 1em; font-weight: 600; border: none; border-radius: 6px; box-shadow: 0 2px 8px #90caf9; cursor: pointer; text-decoration: none; transition: background 0.2s; }
    .access-btn:hover { background: #1565c0; }
    .footer { margin-top: 18px; color: #666; font-size: 0.9em; text-align: center; }
    @media (max-width: 600px) { .container { max-width: 96vw; padding: 10px 3vw; margin: 16px auto 0 auto; } h1 { font-size: 1.05em; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="icon-badge" aria-hidden="true">🎓</div>
      <div class="brand-title">Portal Educativo CEBAC</div>
    </div>
    <div class="tagline">Aprender para transformar</div>
    <div class="wave" aria-hidden="true">
      <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0,32 C240,80 480,0 720,24 C960,48 1200,80 1440,40 L1440,80 L0,80 Z" fill="#ffffff"></path>
      </svg>
    </div>
  </div>
  <div class="container">
    <h1>¡Cuenta activada!</h1>
    <p>¡Bienvenido, <b>Juan Pérez</b>! Tu cuenta ha sido activada exitosamente y ahora formas parte de nuestra comunidad educativa.</p>
    <div class="user-info">
      <p><b>Correo electrónico:</b> juan.perez@email.com</p>
      <p><b>Fecha de activación:</b> ${new Date().toLocaleDateString('es-ES')}</p>
      <p><b>Rol asignado:</b> Estudiante</p>
    </div>
    <a href="#" class="access-btn">Acceder al portal</a>
    <p style="margin-top:12px;">Accede a tus cursos, materiales y actividades desde el menú principal. Si tienes dudas, consulta la sección de ayuda o comunícate con el equipo de soporte.</p>
  </div>
  <div class="footer">Este mensaje es una simulación de activación de cuenta para fines educativos. CEBAC &copy; 2025</div>
</body>
</html>`;

    res.status(200).send(html);
  } catch (err) {
    next(err);
  }
};
// usuariosService require moved to top

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

exports.createUsuarioYPersona = async (req, res, next) => {
  try {
    const result = await usuariosService.createUsuarioYPersona(req.body);
    res.status(201).json({ state: 'success', data: result, message: 'Usuario y Persona creados', action_code: 201 });
  } catch (err) {
    next(err);
  }
};
