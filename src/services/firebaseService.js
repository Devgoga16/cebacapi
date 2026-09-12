const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const FcmToken = require('../models/fcmToken');

let messaging = null;

function initFirebase() {
  if (messaging) return;
  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      serviceAccount = require(path.join(__dirname, '..', '..', 'serviceAccountKey.json'));
    }
    const app = initializeApp({ credential: cert(serviceAccount) });
    messaging = getMessaging(app);
    console.log('[firebase] Admin SDK inicializado');
  } catch (err) {
    console.warn('[firebase] No se pudo inicializar Firebase Admin:', err.message);
  }
}

initFirebase();

exports.registrarToken = async (persona_id, token, platform = 'android') => {
  await FcmToken.findOneAndUpdate(
    { token },
    { persona_id, token, platform, activo: true },
    { upsert: true, new: true },
  );
};

exports.enviarPushAPersona = async (persona_id, { titulo, cuerpo, data = {} }) => {
  if (!messaging) return;
  try {
    const tokens = await FcmToken.find({ persona_id, activo: true }).select('token').lean();
    if (!tokens.length) return;

    const fcmTokens = tokens.map(t => t.token);
    const response = await messaging.sendEachForMulticast({
      tokens: fcmTokens,
      notification: { title: titulo, body: cuerpo },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });

    response.responses.forEach((resp, i) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        FcmToken.updateOne({ token: fcmTokens[i] }, { activo: false }).catch(() => {});
      }
    });
  } catch (err) {
    console.error('[firebase] Error enviando push:', err.message);
  }
};

exports.enviarPushAMuchos = async (personaIds, { titulo, cuerpo, data = {} }) => {
  if (!messaging || !personaIds.length) return;
  try {
    const tokens = await FcmToken.find({
      persona_id: { $in: personaIds },
      activo: true,
    }).select('token').lean();

    if (!tokens.length) return;

    const fcmTokens = tokens.map(t => t.token);
    for (let i = 0; i < fcmTokens.length; i += 500) {
      const batch = fcmTokens.slice(i, i + 500);
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title: titulo, body: cuerpo },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
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
