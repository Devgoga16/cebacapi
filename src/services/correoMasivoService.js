const Persona = require('../models/persona');
const { sendMultipleEmailAsync } = require('../utils/emailNotifier');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Construye el HTML del correo masivo, reutilizando el mismo estilo/colores
 * (gradiente azul institucional CEBAC) que los demás correos del sistema.
 */
function construirHtmlCorreoMasivo({ titulo, texto }) {
  const parrafos = String(texto || '')
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Encabezado -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a3a6e 0%,#2e6bbf 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">${titulo}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">CEBAC — Centro de Enseñanza Bíblica Alianza Comas</p>
            </td>
          </tr>
          <!-- Cuerpo -->
          <tr>
            <td style="padding:36px 40px;">
              ${parrafos}
            </td>
          </tr>
          <!-- Pie -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e8ecf0;">
              <p style="margin:0;font-size:13px;color:#999;">© ${new Date().getFullYear()} CEBAC — Centro de Estudios Bíblicos. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function validarCampos({ titulo, texto }) {
  if (!titulo || !titulo.trim()) {
    const err = new Error('El título del correo es requerido');
    err.statusCode = 400;
    throw err;
  }
  if (!texto || !texto.trim()) {
    const err = new Error('El texto del correo es requerido');
    err.statusCode = 400;
    throw err;
  }
}

// El servicio de notificaciones rechaza el LOTE COMPLETO si encuentra un solo
// email con formato inválido entre los destinatarios, así que hay que filtrar
// antes de enviar (de lo contrario no le llega nada a nadie).
const LOTE_MAXIMO = 200;

/**
 * Envía el correo masivo a todas las personas que tengan un email válido
 * registrado. Se envía en lotes para evitar que el servicio de notificaciones
 * rechace una sola llamada con demasiados destinatarios.
 */
exports.enviarATodos = async ({ titulo, texto }) => {
  validarCampos({ titulo, texto });

  const personas = await Persona.find({ email: { $exists: true, $nin: ['', null] } })
    .select('email')
    .lean();

  const todos = [...new Set(personas.map((p) => (p.email || '').trim()).filter(Boolean))];
  const destinatarios = todos.filter((email) => EMAIL_REGEX.test(email));
  const descartados = todos.length - destinatarios.length;

  if (destinatarios.length === 0) {
    return { totalDestinatarios: 0, descartados };
  }

  const html = construirHtmlCorreoMasivo({ titulo, texto });

  for (let i = 0; i < destinatarios.length; i += LOTE_MAXIMO) {
    const lote = destinatarios.slice(i, i + LOTE_MAXIMO);
    await sendMultipleEmailAsync(lote, titulo, html);
  }

  return { totalDestinatarios: destinatarios.length, descartados };
};

/**
 * Igual que enviarATodos, pero envía un correo a la vez (no por lotes) e
 * invoca onProgress después de cada envío para que el llamador pueda
 * reportar el avance en tiempo real (ej. un stream HTTP hacia el frontend).
 * Un fallo puntual en un destinatario no detiene el resto del proceso.
 */
exports.enviarATodosConProgreso = async ({ titulo, texto }, onProgress) => {
  validarCampos({ titulo, texto });

  const personas = await Persona.find({ email: { $exists: true, $nin: ['', null] } })
    .select('email')
    .lean();

  const todos = [...new Set(personas.map((p) => (p.email || '').trim()).filter(Boolean))];
  const destinatarios = todos.filter((email) => EMAIL_REGEX.test(email));
  const descartados = todos.length - destinatarios.length;
  const total = destinatarios.length;

  const html = construirHtmlCorreoMasivo({ titulo, texto });

  let enviados = 0;
  let fallidos = 0;

  for (const email of destinatarios) {
    try {
      await sendMultipleEmailAsync([email], titulo, html);
      enviados += 1;
    } catch (err) {
      fallidos += 1;
    }
    if (typeof onProgress === 'function') {
      onProgress({ total, enviados, fallidos, descartados, email });
    }
  }

  return { total, enviados, fallidos, descartados };
};

/**
 * Envía el correo a una sola dirección específica indicada por el admin.
 */
exports.enviarAUno = async ({ titulo, texto, email }) => {
  validarCampos({ titulo, texto });

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    const err = new Error('Debes indicar un correo electrónico válido');
    err.statusCode = 400;
    throw err;
  }

  const html = construirHtmlCorreoMasivo({ titulo, texto });
  await sendMultipleEmailAsync([email.trim()], titulo, html);

  return { totalDestinatarios: 1 };
};
