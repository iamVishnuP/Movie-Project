const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  universe_domain: "googleapis.com"
};

const app = initializeApp({
  credential: cert(serviceAccount)
});

// Using the named database 'movie' as seen in your Firebase console
const db = getFirestore(app, 'movie');
db.settings({ ignoreUndefinedProperties: true });
const auth = getAuth(app);

module.exports = { admin: require('firebase-admin'), db, auth };
