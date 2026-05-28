require('dotenv').config();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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

console.log('Testing connection to project:', serviceAccount.project_id);
console.log('Target Database: movie');

try {
  const app = initializeApp({
    credential: cert(serviceAccount)
  });
  
  const db = getFirestore(app, 'movie');
  
  db.collection('users').limit(1).get()
    .then(snapshot => {
      console.log('Connection Successful!');
      console.log('Found documents in "users" collection:', snapshot.size);
      process.exit(0);
    })
    .catch(err => {
      console.error('Firestore Error:', err);
      process.exit(1);
    });
} catch (e) {
  console.error('Initialization Error:', e.message);
  process.exit(1);
}
