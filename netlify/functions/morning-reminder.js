const admin = require('firebase-admin');

let app;
const getApp = () => {
  if (!app) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    });
  }
  return app;
};

// Runs every day at 7am Sydney time (UTC+10 = 9pm UTC previous day)
// Schedule: "0 21 * * *"
exports.handler = async (event) => {
  try {
    const firebase = getApp();
    const db = admin.database();

    // Get all FCM tokens
    const tokensSnap = await db.ref('fcmTokens').once('value');
    const tokens = tokensSnap.val();
    if (!tokens) return { statusCode: 200, body: 'No tokens' };

    // Check who hasn't logged today
    const today = new Date().toISOString().split('T')[0];
    const challengeSnap = await db.ref('challenge').once('value');
    const challenge = challengeSnap.val() || {};

    const sends = [];
    for (const [playerId, token] of Object.entries(tokens)) {
      const todaySets = challenge[playerId]?.logs?.[today]?.sets;
      if (!todaySets) {
        // Hasn't logged today — send reminder
        const name = playerId === 'jeremy' ? 'Jeremy' : 'Grant';
        sends.push(
          admin.messaging().send({
            token,
            notification: {
              title: 'Morning Pushups 💪',
              body: `${name}, time for your daily set!`,
            },
            webpush: {
              fcmOptions: { link: 'https://uppush.netlify.app' },
            },
          }).catch(e => console.error(`Failed for ${playerId}:`, e))
        );
      }
    }

    await Promise.all(sends);
    return { statusCode: 200, body: JSON.stringify({ sent: sends.length }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: error.message };
  }
};
