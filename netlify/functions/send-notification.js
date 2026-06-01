const admin = require('firebase-admin');

// Initialize Firebase Admin
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    getApp();
    const { token, title, body, data } = JSON.parse(event.body);

    const message = {
      notification: { title, body },
      data: data || {},
      token,
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [100, 50, 100],
        },
        fcmOptions: { link: 'https://uppush.netlify.app' },
      },
    };

    const response = await admin.messaging().send(message);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: response }),
    };
  } catch (error) {
    console.error('Notification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
