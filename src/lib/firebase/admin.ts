import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://antijj-dev-default-rtdb.firebaseio.com',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'antijj-dev.appspot.com',
    });
  } else {
    // Development / Emulator Fallback
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'antijj-dev',
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'http://127.0.0.1:9000?ns=antijj-dev-default-rtdb',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'antijj-dev.appspot.com',
    });
  }
}

export const adminAuth = admin.auth();
export const adminRtdb = admin.database();
export const adminStorage = admin.storage();
export const adminMessaging = admin.messaging();
