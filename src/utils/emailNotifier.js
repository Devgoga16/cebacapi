const https = require('https');
const http = require('http');

/**
 * Envía un correo a múltiples destinatarios usando el servicio de notificaciones centralizado.
 * Fire-and-forget: los errores se loguean pero no interrumpen el flujo principal.
 * @param {string[]} to - Lista de correos destino
 * @param {string} subject - Asunto del correo
 * @param {string} html - Cuerpo HTML del correo
 */
function sendMultipleEmail(to, subject, html) {
  if (!Array.isArray(to) || to.length === 0) return;

  const baseUrl = process.env.NOTIFICATIONS_API_URL || 'https://bot-cebac.iglesia-360.com/api';
  const apiKey = process.env.NOTIFICATIONS_API_KEY || '';
  const body = JSON.stringify({ to, subject, html });

  const url = new URL(`${baseUrl}/email/send-multiple`);
  const isHttps = url.protocol === 'https:';
  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'accept': '*/*',
      'x-api-key': apiKey,
    },
  };

  const transport = isHttps ? https : http;
  const req = transport.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        console.error(`[sendMultipleEmail] Respuesta no exitosa (${res.statusCode}):`, data);
      }
    });
  });
  req.on('error', (err) => {
    console.error('[sendMultipleEmail] Error al enviar correo múltiple:', err?.message || err);
  });
  req.write(body);
  req.end();
}

module.exports = { sendMultipleEmail };
