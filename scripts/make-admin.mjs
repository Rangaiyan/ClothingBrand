// Grants the admin custom claim. Run once to create the first admin; after that,
// admins can grant it from the dashboard via the setAdminRole function.
//
//   GOOGLE_APPLICATION_CREDENTIALS=key.json node scripts/make-admin.mjs owner@example.com
//   (add FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 to target the emulator)
import { createRequire } from "node:module";

const require = createRequire(new URL("../functions/", import.meta.url));
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/make-admin.mjs <email>");
  process.exit(1);
}
initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID });
const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { admin: true });
console.log(`${email} is now an admin. They must sign out and back in for it to apply.`);
