import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getMessaging, isSupported } from 'firebase/messaging';

// Replace these with your Firebase project config
// Get from: Firebase Console > Project Settings > Your apps > SDK setup
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const getMessagingInstance = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export default app;
