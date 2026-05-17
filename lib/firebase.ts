import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const config = firebaseConfig;
const app = getApps().length === 0 
  ? initializeApp(config) 
  : getApps()[0];

// Use initializeFirestore with experimentalForceLongPolling to improve connectivity in constrained environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connectivity verified.");
  } catch (error: any) {
    // If we get permission-denied, it means we successfully contacted the server!
    if (error?.code === 'permission-denied') {
      console.log("Firestore connectivity verified (Backend reached).");
      return;
    }
    
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else {
      console.error("Firestore connectivity test failed:", error);
    }
  }
}

// Only run in browser
if (typeof window !== 'undefined') {
  testConnection();
}
