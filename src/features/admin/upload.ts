import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads an image to Storage and returns its download URL. Only the URL is kept in Firestore. */
export async function uploadImage(folder: "products" | "categories" | "banners", id: string, file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size >= MAX_BYTES) throw new Error("Images must be under 5 MB.");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const r = ref(getFirebaseStorage(), `${folder}/${id}/${Date.now()}-${safe}`);
  await uploadBytes(r, file, { contentType: file.type });
  return getDownloadURL(r);
}
