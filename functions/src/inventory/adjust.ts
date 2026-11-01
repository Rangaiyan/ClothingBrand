import { FieldValue } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { callableOptions, db, requireAdmin, requireAuth, toHttpsError } from "../config";
import { OrderError } from "../errors";

const input = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  newStock: z.number().int().min(0).max(100000),
  note: z.string().max(200).optional(),
});

/** Admin stock correction. Writes an inventoryLogs entry with the delta. */
export const adjustStock = onCall({ ...callableOptions, secrets: [] }, async (req) => {
  try {
    requireAuth(req.auth?.uid);
    requireAdmin(req.auth?.token as Record<string, unknown>);
    const parsed = input.safeParse(req.data);
    if (!parsed.success) throw new OrderError("invalid-argument", "Invalid stock update.");
    const { productId, sku, newStock, note } = parsed.data;

    await db.runTransaction(async (tx) => {
      const ref = db.doc(`products/${productId}`);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new OrderError("not-found", "Product not found.");
      const variants = snap.data()!.variants as { sku: string; stock: number }[];
      const v = variants.find((x) => x.sku === sku);
      if (!v) throw new OrderError("not-found", "Variant not found.");
      const delta = newStock - v.stock;
      tx.update(ref, { variants: variants.map((x) => (x.sku === sku ? { ...x, stock: newStock } : x)) });
      tx.set(db.collection("inventoryLogs").doc(), {
        productId, sku, delta, reason: "admin_adjustment", note: note ?? null,
        by: req.auth!.uid, at: FieldValue.serverTimestamp(),
      });
    });
    return { ok: true };
  } catch (e) {
    throw toHttpsError(e);
  }
});
