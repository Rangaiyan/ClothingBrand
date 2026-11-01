// Copies the bundled catalogue (src/services/seed-data.ts) into Firestore.
//
// Safe to re-run: documents that already exist are SKIPPED, so live stock, edits made in
// the admin dashboard, and sold counts are never overwritten. Use --force to overwrite.
//
//   GOOGLE_APPLICATION_CREDENTIALS=service-account.json GCLOUD_PROJECT=<id> \
//     node --experimental-strip-types scripts/migrate-products.mjs [--dry-run] [--force]
//   (add FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 to target the emulator)
import { createRequire } from "node:module";

const require = createRequire(new URL("../functions/", import.meta.url));
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { seedCategories, seedProducts } = await import("../src/services/seed-data.ts");

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Set GCLOUD_PROJECT to your Firebase project id.");
  process.exit(1);
}

initializeApp({ projectId });
const db = getFirestore();
console.log(`Project: ${projectId}${process.env.FIRESTORE_EMULATOR_HOST ? " (emulator)" : ""}${dryRun ? " [dry run]" : ""}`);

async function migrate(collection, items) {
  const refs = items.map(({ id }) => db.doc(`${collection}/${id}`));
  const snaps = await db.getAll(...refs);
  const batch = db.batch();
  let created = 0, skipped = 0, overwritten = 0;
  items.forEach(({ id, ...data }, i) => {
    if (snaps[i].exists && !force) {
      skipped++;
      console.log(`  skip     ${collection}/${id} (already exists)`);
      return;
    }
    snaps[i].exists ? overwritten++ : created++;
    console.log(`  ${snaps[i].exists ? "overwrite" : "create   "} ${collection}/${id}  ${data.name ?? ""}`);
    batch.set(refs[i], data);
  });
  if (!dryRun && created + overwritten > 0) await batch.commit();
  console.log(`${collection}: ${created} created, ${overwritten} overwritten, ${skipped} skipped`);
}

await migrate("categories", seedCategories);
await migrate("products", seedProducts);
console.log(dryRun ? "Dry run only; nothing was written." : "Done.");
