const https = require('https');
const http = require('http');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Hace la llamada HTTP única al servicio de WhatsApp para crear un grupo.
 */
function intentarCrearGrupoWhatsApp(name, participants) {
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

    console.log(`[crearGrupoWhatsApp] POST ${url.toString()} body=${body}`);

    const transport = isHttps ? https : http;
    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[crearGrupoWhatsApp] status=${res.statusCode} body=${data}`);

        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          const err = new Error(`Respuesta inválida del servicio de WhatsApp (status ${res.statusCode}): ${data}`);
          err.statusCode = res.statusCode;
          err.rawBody = data;
          return reject(err);
        }

        if (res.statusCode < 200 || res.statusCode >= 300 || parsed.success === false) {
          const detalle = [parsed.error, parsed.details, parsed.message].filter(Boolean).join(' — ');
          const err = new Error(`Error al crear el grupo de WhatsApp (status ${res.statusCode}): ${detalle || JSON.stringify(parsed)}`);
          err.statusCode = res.statusCode;
          err.response = parsed;
          err.isRateLimit = parsed.details === 'rate-overlimit' || /rate.?limit/i.test(detalle);
          return reject(err);
        }

        resolve(parsed);
      });
    });

    req.on('error', (err) => {
      console.error('[crearGrupoWhatsApp] Error de red:', err?.message || err);
      reject(err);
    });
    req.write(body);
    req.end();
  });
}

/**
 * Hace la llamada HTTP única para agregar participantes a un grupo ya existente.
 */
function intentarAgregarParticipantes(groupId, participants) {
  return new Promise((resolve, reject) => {
    const baseUrl = process.env.NOTIFICATIONS_API_URL || 'https://bot-cebac.iglesia-360.com/api';
    const apiKey = process.env.NOTIFICATIONS_API_KEY || '';
    const body = JSON.stringify({ participants });

    const url = new URL(`${baseUrl}/whatsapp/groups/${groupId}/participants`);
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

    console.log(`[agregarParticipantes] POST ${url.toString()} body=${body}`);

    const transport = isHttps ? https : http;
    const req = transport.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[agregarParticipantes] status=${res.statusCode} body=${data}`);

        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          const err = new Error(`Respuesta inválida al agregar participantes (status ${res.statusCode}): ${data}`);
          err.statusCode = res.statusCode;
          err.rawBody = data;
          return reject(err);
        }

        if (res.statusCode < 200 || res.statusCode >= 300 || parsed.success === false) {
          const detalle = [parsed.error, parsed.details, parsed.message].filter(Boolean).join(' — ');
          const err = new Error(`Error al agregar participantes al grupo (status ${res.statusCode}): ${detalle || JSON.stringify(parsed)}`);
          err.statusCode = res.statusCode;
          err.response = parsed;
          err.isRateLimit = parsed.details === 'rate-overlimit' || /rate.?limit/i.test(detalle);
          return reject(err);
        }

        resolve(parsed);
      });
    });

    req.on('error', (err) => {
      console.error('[agregarParticipantes] Error de red:', err?.message || err);
      reject(err);
    });
    req.write(body);
    req.end();
  });
}

/**
 * Agrega participantes a un grupo existente, con reintento por backoff ante rate-overlimit.
 * @param {string} groupId
 * @param {string[]} participants
 */
async function agregarParticipantesGrupo(groupId, participants, { maxIntentos = 3, esperaBaseMs = 10000 } = {}) {
  let ultimoError;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      return await intentarAgregarParticipantes(groupId, participants);
    } catch (err) {
      ultimoError = err;

      if (!err.isRateLimit || intento === maxIntentos) {
        throw err;
      }

      const espera = esperaBaseMs * intento;
      console.warn(`[agregarParticipantes] rate-overlimit, reintento ${intento}/${maxIntentos} en ${espera}ms`);
      await sleep(espera);
    }
  }

  throw ultimoError;
}

/**
 * Crea un grupo de WhatsApp usando el servicio centralizado de notificaciones.
 * Reintenta automáticamente con backoff cuando la API responde "rate-overlimit"
 * (límite anti-spam de WhatsApp al agregar muchos participantes de golpe).
 * @param {string} name - Nombre del grupo
 * @param {string[]} participants - Lista de números (sin código de país, ej: "933180959")
 * @param {{ maxIntentos?: number, esperaBaseMs?: number }} [opciones]
 * @returns {Promise<{ success: boolean, message: string, data: object }>}
 */
async function crearGrupoWhatsApp(name, participants, { maxIntentos = 3, esperaBaseMs = 10000 } = {}) {
  let ultimoError;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      return await intentarCrearGrupoWhatsApp(name, participants);
    } catch (err) {
      ultimoError = err;

      if (!err.isRateLimit || intento === maxIntentos) {
        throw err;
      }

      const espera = esperaBaseMs * intento; // backoff lineal: 10s, 20s, 30s...
      console.warn(`[crearGrupoWhatsApp] rate-overlimit, reintento ${intento}/${maxIntentos} en ${espera}ms`);
      await sleep(espera);
    }
  }

  throw ultimoError;
}

module.exports = { crearGrupoWhatsApp, agregarParticipantesGrupo, sleep };
