// Loads the sample catalogue, categories and a welcome coupon into Firestore.
//
//   GOOGLE_APPLICATION_CREDENTIALS=key.json GCLOUD_PROJECT=<id> node scripts/seed.mjs
//   (add FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 to target the emulator)
import { createRequire } from "node:module";

const require = createRequire(new URL("../functions/", import.meta.url));
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { seedCategories, seedProducts } = await import("../src/services/seed-data.ts");

initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID });
const db = getFirestore();
const batch = db.batch();
for (const { id, ...c } of seedCategories) batch.set(db.doc(`categories/${id}`), c);
for (const { id, ...p } of seedProducts) batch.set(db.doc(`products/${id}`), p);
batch.set(db.doc("storeSettings/main"), {
  announcement: "Free shipping across India on orders above ₹1,999",
  contactEmail: "", contactPhone: "", address: "", instagram: "", facebook: "", codEnabled: true,
});
batch.set(db.doc("coupons/WELCOME10"), {
  code: "WELCOME10", type: "percent", value: 10, minOrder: 999, maxDiscount: 300,
  usageLimit: null, perUserLimit: 1, expiresAt: null, active: true, usedCount: 0,
});
await batch.commit();
console.log(`Seeded ${seedCategories.length} categories, ${seedProducts.length} products, settings and WELCOME10.`);
