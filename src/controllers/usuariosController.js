// Simula la validación de cuenta
const { sendResponse } = require('../utils/helpers');

exports.validarUsuario = async (req, res, next) => {
  try {
    const result = await require('../services/usuariosService').validarUsuario(req.params.id);
    res.status(200).send(`
      <html lang="es">
        <head>
          <title>¡Cuenta activada - Portal CEBAC!</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Montserrat', Arial, sans-serif;
              background: linear-gradient(120deg, #e3f2fd 0%, #fff 100%);
              margin: 0;
              color: #222;
            }
            .header {
              background: #1976d2;
              color: #fff;
              padding: 28px 0 24px 0;
              text-align: center;
              border-bottom-left-radius: 0;
              border-bottom-right-radius: 0;
              box-shadow: 0 2px 8px #90caf9;
              animation: fadeInDown 1s;
              position: relative;
              z-index: 2;
            }
            @keyframes fadeInDown {
              from { opacity: 0; transform: translateY(-40px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .header .icon {
              font-size: 3em;
              margin-bottom: 8px;
              animation: bounce 1.2s;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-12px); }
            }
            .container {
              max-width: 700px;
              margin: 32px auto 0 auto;
              background: #fff;
              border-radius: 12px;
              box-shadow: 0 2px 12px #bbdefb;
              padding: 22px 16px 18px 16px;
              position: relative;
              animation: fadeInUp 1.2s;
              z-index: 3;
              display: flex;
              flex-direction: row;
              gap: 24px;
              align-items: flex-start;
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(40px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .main-info {
              flex: 2;
              min-width: 220px;
            }
            .side-info {
              flex: 1;
              min-width: 180px;
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            h1 {
              color: #1976d2;
              font-size: 1.35em;
              margin-bottom: 10px;
              font-weight: 700;
            }
            .user-info {
              background: #e3f2fd;
              border-radius: 8px;
              padding: 10px 10px;
              margin: 16px 0 10px 0;
              color: #1565c0;
              font-size: 0.95em;
              box-shadow: 0 1px 4px #bbdefb;
            }
            .achievements {
              background: #fffde7;
              border-radius: 8px;
              padding: 8px 10px;
              margin: 12px 0 0 0;
              color: #fbc02d;
              font-size: 0.93em;
              box-shadow: 0 1px 4px #ffe082;
            }
            .achievements ul {
              margin: 8px 0 0 16px;
              padding: 0;
              color: #795548;
            }
            .motivational {
              margin: 16px 0 0 0;
              font-size: 1em;
              color: #388e3c;
              font-weight: 600;
              background: #e8f5e9;
              border-radius: 8px;
              padding: 8px 10px;
              box-shadow: 0 1px 4px #c8e6c9;
            }
            .access-btn {
              display: inline-block;
              margin: 18px 0 0 0;
              padding: 8px 18px;
              background: #1976d2;
              color: #fff;
              font-size: 1em;
              font-weight: 600;
              border: none;
              border-radius: 6px;
              box-shadow: 0 2px 8px #90caf9;
              cursor: pointer;
              text-decoration: none;
              transition: background 0.2s;
            }
            .access-btn:hover {
              background: #1565c0;
            }
            .footer {
              margin-top: 24px;
              color: #666;
              font-size: 0.9em;
              text-align: center;
            }
            @media (max-width: 800px) {
              .container {
                flex-direction: column;
                max-width: 98vw;
                padding: 10px 2vw;
                margin: 16px auto 0 auto;
              }
              .main-info, .side-info {
                min-width: unset;
                width: 100%;
              }
            }
            @media (max-width: 600px) {
              h1 {
                font-size: 1em;
              }
              .user-info, .achievements, .motivational {
                font-size: 0.9em;
                padding: 6px 4px;
              }
              .access-btn {
                font-size: 0.95em;
                padding: 6px 12px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="icon">🎓</div>
            <div style="font-size:1.3em;font-weight:600;">Portal Educativo CEBAC</div>
          </div>
          <div class="container">
            <div class="main-info">
              <h1>¡Cuenta activada!</h1>
              <p>¡Bienvenido, <b>Juan Pérez</b>! Tu cuenta ha sido activada exitosamente y ahora formas parte de nuestra comunidad educativa.</p>
              <div class="user-info">
                <p><b>Correo electrónico:</b> juan.perez@email.com</p>
                <p><b>Fecha de activación:</b> ${new Date().toLocaleDateString('es-ES')}</p>
                <p><b>Rol asignado:</b> Estudiante</p>
              </div>
              <a href="#" class="access-btn">Acceder al portal</a>
              <p style="margin-top:18px;">Accede a tus cursos, materiales y actividades desde el menú principal. Si tienes dudas, consulta la sección de ayuda o comunícate con el equipo de soporte.</p>
            </div>
            <div class="side-info">
              <div class="achievements">
                <b>¡Primeros logros desbloqueados!</b>
                <ul>
                  <li>✔ Registro exitoso</li>
                  <li>✔ Acceso a cursos básicos</li>
                  <li>✔ Bienvenida a la comunidad CEBAC</li>
                </ul>
              </div>
              <div class="motivational">
                "La educación es el arma más poderosa para cambiar el mundo."<br>
                <span style="font-size:0.98em;color:#1976d2;">¡Comienza tu aprendizaje hoy y alcanza tus metas!</span>
              </div>
            </div>
          </div>
          <div class="footer">Este mensaje es una simulación de activación de cuenta para fines educativos.<br>CEBAC &copy; 2025</div>
        </body>
      </html>
    `);
  } catch (err) {
    next(err);
  }
};
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

exports.createUsuarioYPersona = async (req, res, next) => {
  try {
    const result = await usuariosService.createUsuarioYPersona(req.body);
    res.status(201).json({ state: 'success', data: result, message: 'Usuario y Persona creados', action_code: 201 });
  } catch (err) {
    next(err);
  }
};
