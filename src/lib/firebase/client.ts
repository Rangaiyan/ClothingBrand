import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Lazy getters: importing this module never throws when keys are missing.
function app() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local.");
  }
  if (getApps().length) return getApp();
  const created = initializeApp(firebaseConfig);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (typeof window !== "undefined" && siteKey && process.env.NEXT_PUBLIC_USE_EMULATORS !== "true") {
    initializeAppCheck(created, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
  }
  return created;
}

// Local development against the Firebase emulators: NEXT_PUBLIC_USE_EMULATORS=true.
const useEmulators = process.env.NEXT_PUBLIC_USE_EMULATORS === "true";
const HOST = "127.0.0.1";
const once = <T>(make: () => T) => {
  let v: T | undefined;
  return () => (v ??= make());
};

export const getFirebaseAuth = once(() => {
  const a = getAuth(app());
  if (useEmulators) connectAuthEmulator(a, `http://${HOST}:9099`, { disableWarnings: true });
  return a;
});
export const getDb = once(() => {
  const d = getFirestore(app());
  if (useEmulators) connectFirestoreEmulator(d, HOST, 8080);
  return d;
});
export const getFirebaseStorage = once(() => {
  const st = getStorage(app());
  if (useEmulators) connectStorageEmulator(st, HOST, 9199);
  return st;
});
export const getFirebaseFunctions = once(() => {
  const f = getFunctions(app(), "asia-south1");
  if (useEmulators) connectFunctionsEmulator(f, HOST, 5001);
  return f;
});
