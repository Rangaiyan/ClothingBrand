import { getAuth } from "firebase-admin/auth";
import { onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { callableOptions, requireAdmin, requireAuth, toHttpsError } from "./config";
import { OrderError } from "./errors";

const input = z.object({ email: z.string().email(), admin: z.boolean() });
const opts = { ...callableOptions, secrets: [] };

/** Grants or revokes the admin custom claim. Only an existing admin can call it. */
export const setAdminRole = onCall(opts, async (req) => {
  try {
    const callerUid = requireAuth(req.auth?.uid);
    requireAdmin(req.auth?.token as Record<string, unknown>);
    const parsed = input.safeParse(req.data);
    if (!parsed.success) throw new OrderError("invalid-argument", "Invalid request.");

    let user;
    try {
      user = await getAuth().getUserByEmail(parsed.data.email);
    } catch {
      throw new OrderError("not-found", "No account with that email. Ask them to register on the store first.");
    }
    // An admin can't remove their own access, so the store can't be left without one.
    if (user.uid === callerUid && !parsed.data.admin)
      throw new OrderError("failed-precondition", "You can't remove your own admin access.");

    await getAuth().setCustomUserClaims(user.uid, { ...user.customClaims, admin: parsed.data.admin });
    return { ok: true };
  } catch (e) {
    throw toHttpsError(e);
  }
});

/** Lists accounts that currently hold the admin claim. */
export const listAdmins = onCall(opts, async (req) => {
  try {
    requireAuth(req.auth?.uid);
    requireAdmin(req.auth?.token as Record<string, unknown>);
    const admins: { uid: string; email: string; name: string }[] = [];
    let pageToken: string | undefined;
    do {
      const page = await getAuth().listUsers(1000, pageToken);
      for (const u of page.users) {
        if (u.customClaims?.admin === true) admins.push({ uid: u.uid, email: u.email ?? "", name: u.displayName ?? "" });
      }
      pageToken = page.pageToken;
    } while (pageToken);
    return { admins };
  } catch (e) {
    throw toHttpsError(e);
  }
});
