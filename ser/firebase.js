const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Optional: Test the connection during startup
async function testConnection() {
    try {
        const testDoc = await db.collection('system_config').doc('test').get();
        console.log('Firebase Admin SDK initialized and connected to Firestore.');
    } catch (err) {
        console.error('Firebase connection error:', err);
    }
}

testConnection();

module.exports = { admin, db };
