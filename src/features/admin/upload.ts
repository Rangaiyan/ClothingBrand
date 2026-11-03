import { getFirebaseAuth } from "@/lib/firebase/client";

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads an image to Cloudinary (signed by our server) and returns its URL. Only the URL is kept in Firestore. */
export async function uploadImage(folder: "products" | "categories" | "banners", id: string, file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size >= MAX_BYTES) throw new Error("Images must be under 5 MB.");
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Please sign in again.");

  const res = await fetch("/api/admin/cloudinary-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify({ folder, id }),
  });
  const sig = await readJson(res);
  if (!res.ok || !sig.apiKey) throw new Error(sig.error ?? `Could not start upload (server returned ${res.status}).`);

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("folder", sig.folder);
  body.append("signature", sig.signature);
  const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body });
  const data = await readJson(up);
  if (!up.ok || !data.secure_url) throw new Error(data.error?.message ?? `Upload failed (Cloudinary returned ${up.status}).`);
  return data.secure_url as string;
}

/** Parses a response without throwing when the body is empty or not JSON (proxies and crashes can do that). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}
