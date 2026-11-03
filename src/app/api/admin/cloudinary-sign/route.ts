const FOLDERS = new Set(["products", "categories", "banners"]);

/** SHA-1 hex using Web Crypto, so this works on Node and on edge/worker runtimes alike. */
async function sha1(text: string) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Checks the ID token with Google (Identity Toolkit) and reads the custom claims it returns.
 * Google validates the token, so no Admin SDK or service account is needed here.
 */
async function isAdmin(token: string, apiKey: string) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: token }),
  });
  if (!r.ok) return null;
  const data = (await r.json()) as { users?: { customAttributes?: string }[] };
  const user = data.users?.[0];
  if (!user) return null;
  try { return JSON.parse(user.customAttributes ?? "{}").admin === true; } catch { return false; }
}

/**
 * Signs a Cloudinary upload for an authenticated admin. The API secret never leaves the server;
 * the admin claim is checked here, not just in the UI.
 */
export async function POST(req: Request) {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const firebaseKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const missing = [
      !cloudName && "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", !apiKey && "CLOUDINARY_API_KEY",
      !apiSecret && "CLOUDINARY_API_SECRET", !firebaseKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
    ].filter(Boolean);
    if (missing.length) return Response.json({ error: `Server is missing: ${missing.join(", ")}.` }, { status: 500 });

    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const admin = await isAdmin(token, firebaseKey!);
    if (admin === null) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const { folder, id } = (await req.json().catch(() => ({}))) as { folder?: string; id?: string };
    if (!folder || !FOLDERS.has(folder) || !id || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const path = `kameleon/${folder}/${id}`;
    // Cloudinary signs the alphabetically sorted params followed by the secret.
    const signature = await sha1(`folder=${path}&timestamp=${timestamp}${apiSecret}`);
    return Response.json({ cloudName, apiKey, timestamp, folder: path, signature });
  } catch (e) {
    return Response.json({ error: `Signing failed: ${e instanceof Error ? e.message : "unknown error"}` }, { status: 500 });
  }
}
