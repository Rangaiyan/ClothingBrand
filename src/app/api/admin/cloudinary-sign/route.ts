import { createHash } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const FOLDERS = new Set(["products", "categories", "banners"]);

/**
 * Signs a Cloudinary upload for an authenticated admin. The API secret never leaves the server;
 * the admin claim is checked here, not just in the UI.
 */
export async function POST(req: Request) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return Response.json({ error: "Cloudinary is not configured." }, { status: 500 });
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const app = getApps()[0] ?? initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
    const claims = await getAuth(app).verifyIdToken(token);
    if (claims.admin !== true) return Response.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { folder, id } = (await req.json().catch(() => ({}))) as { folder?: string; id?: string };
  if (!folder || !FOLDERS.has(folder) || !id || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const path = `kameleon/${folder}/${id}`;
  // Cloudinary signs the alphabetically sorted params followed by the secret.
  const signature = createHash("sha1").update(`folder=${path}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  return Response.json({ cloudName, apiKey, timestamp, folder: path, signature });
}
