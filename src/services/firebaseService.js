const path = require('path');
const admin = require('firebase-admin');
const FcmToken = require('../models/fcmToken');

// Inicializa Firebase Admin SDK
let initialized = false;
function initFirebase() {
  if (initialized) return;
  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      serviceAccount = require(path.join(__dirname, '..', '..', 'serviceAccountKey.json'));
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('[firebase] Admin SDK inicializado');
  } catch (err) {
    console.warn('[firebase] No se pudo inicializar Firebase Admin:', err.message);
    console.warn('[firebase] Las notificaciones push no funcionarán hasta configurar serviceAccountKey.json');
  }
}

initFirebase();

/**
 * Registra o actualiza un token FCM para una persona.
 */
exports.registrarToken = async (persona_id, token, platform = 'android') => {
  await FcmToken.findOneAndUpdate(
    { token },
    { persona_id, token, platform, activo: true },
    { upsert: true, new: true },
  );
};

/**
 * Envía una notificación push a una persona.
 */
exports.enviarPushAPersona = async (persona_id, { titulo, cuerpo, data = {} }) => {
  if (!initialized) return;
  try {
    const tokens = await FcmToken.find({ persona_id, activo: true }).select('token').lean();
    if (!tokens.length) return;

    const fcmTokens = tokens.map(t => t.token);

    const message = {
      notification: {
        title: titulo,
        body: cuerpo,
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    };

    const response = await admin.messaging().sendEachForMulticast({
      tokens: fcmTokens,
      ...message,
    });

    // Desactivar tokens inválidos
    response.responses.forEach((resp, i) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        FcmToken.updateOne({ token: fcmTokens[i] }, { activo: false }).catch(() => {});
      }
    });
  } catch (err) {
    console.error('[firebase] Error enviando push:', err.message);
  }
};

/**
 * Envía push a múltiples personas.
 */
exports.enviarPushAMuchos = async (personaIds, { titulo, cuerpo, data = {} }) => {
  if (!initialized || !personaIds.length) return;
  try {
    const tokens = await FcmToken.find({
      persona_id: { $in: personaIds },
      activo: true,
    }).select('token').lean();

    if (!tokens.length) return;

    const fcmTokens = tokens.map(t => t.token);

    // Firebase permite max 500 tokens por batch
    for (let i = 0; i < fcmTokens.length; i += 500) {
      const batch = fcmTokens.slice(i, i + 500);
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        notification: { title: titulo, body: cuerpo },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      });

      response.responses.forEach((resp, j) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          FcmToken.updateOne({ token: batch[j] }, { activo: false }).catch(() => {});
        }
      });
    }
  } catch (err) {
    console.error('[firebase] Error enviando push masivo:', err.message);
  }
};
