const https = require('https');
const http = require('http');

/**
 * Crea un grupo de WhatsApp usando el servicio centralizado de notificaciones.
 * A diferencia de los notificadores de email, este SÍ se espera (await) porque
 * necesitamos el groupId/name de la respuesta para guardarlos en el aula.
 * @param {string} name - Nombre del grupo
 * @param {string[]} participants - Lista de números (sin código de país, ej: "933180959")
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
function crearGrupoWhatsApp(name, participants) {
  return new Promise((resolve, reject) => {
    const baseUrl = process.env.NOTIFICATIONS_API_URL || 'https://bot-cebac.iglesia-360.com/api';
    const apiKey = process.env.NOTIFICATIONS_API_KEY || '';
    const body = JSON.stringify({ name, participants });

    const url = new URL(`${baseUrl}/whatsapp/groups`);
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
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          return reject(new Error(`Respuesta inválida del servicio de WhatsApp: ${data}`));
        }

        if (res.statusCode < 200 || res.statusCode >= 300 || parsed.success === false) {
          return reject(new Error(parsed.message || `Error al crear el grupo de WhatsApp (status ${res.statusCode})`));
        }

        resolve(parsed);
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

module.exports = { crearGrupoWhatsApp };
