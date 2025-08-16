
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getMessaging, type Messaging } from "firebase/messaging";

export const firebaseConfig: FirebaseOptions & { browserKey?: string } = {
  "projectId": "ashwani-diagnostic-cente-d2aei",
  "appId": "1:692460395301:web:b524974e72df7c144058cc",
  "storageBucket": "ashwani-diagnostic-cente-d2aei.appspot.com",
  "apiKey": "AIzaSyBRmIBHcS6ZqxRz8fg1pi54bD66FsoGySc",
  "browserKey": "AIzaSyBRmIBHcS6ZqxRz8fg1pi54bD66FsoGySc",
  "authDomain": "ashwanilab.com",
  "messagingSenderId": "692460395301",
  "measurementId": "G-5YEV8TRC9B"
};

// Singleton pattern for Firebase services
let app: ReturnType<typeof initializeApp>;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let messaging: Messaging | undefined;

function initializeFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = typeof window !== 'undefined'
    ? initializeAuth(app, { persistence: browserLocalPersistence })
    : getAuth(app);
    
  db = getFirestore(app);
  storage = getStorage(app);
  messaging = typeof window !== 'undefined' && firebaseConfig.messagingSenderId ? getMessaging(app) : undefined;
}

// Initialize on first load
initializeFirebase();

// Getter functions for services
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getDb = () => db;
export const getFirebaseStorage = () => storage;
export const getMessagingInstance = () => messaging;
