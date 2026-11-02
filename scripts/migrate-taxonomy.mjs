// Moves existing products from the flat vesti/lungi categories to Modern/Traditional
// (category + subcategory + collections). Idempotent; only touches products whose
// category is still "vesti" or "lungi". Stock, prices and images are never changed.
//
//   GOOGLE_APPLICATION_CREDENTIALS=service-account.json GCLOUD_PROJECT=<id> \
//     node --experimental-strip-types scripts/migrate-taxonomy.mjs [--dry-run]
//   (add FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 to target the emulator)
import { createRequire } from "node:module";

const require = createRequire(new URL("../functions/", import.meta.url));
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { taxonomise } = await import("../src/lib/taxonomy.ts");

const dryRun = process.argv.includes("--dry-run");
const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID;
if (!projectId) { console.error("Set GCLOUD_PROJECT to your Firebase project id."); process.exit(1); }

initializeApp({ projectId });
const db = getFirestore();
const snap = await db.collection("products").get();
let changed = 0;
for (const d of snap.docs) {
  const p = d.data();
  if (p.category !== "vesti" && p.category !== "lungi") continue;
  const { category, subcategory, collections } = taxonomise(p);
  console.log(`${dryRun ? "would update" : "update"} ${d.id} (${p.name}): ${p.category} -> ${category}/${subcategory} [${collections.join(", ")}]`);
  if (!dryRun) await d.ref.update({ category, subcategory, collections });
  changed++;
}
console.log(`${changed} product(s) ${dryRun ? "would be " : ""}migrated, ${snap.size - changed} already current.`);
