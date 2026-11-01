import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret, defineString } from "firebase-functions/params";
import { HttpsError, type CallableOptions } from "firebase-functions/v2/https";
import Razorpay from "razorpay";
import { OrderError } from "./errors";

if (!getApps().length) initializeApp();
export const db = getFirestore();

export const RAZORPAY_KEY_ID = defineString("RAZORPAY_KEY_ID");
export const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
export const RAZORPAY_WEBHOOK_SECRET = defineSecret("RAZORPAY_WEBHOOK_SECRET");

export const REGION = "asia-south1";

const emulated = process.env.FUNCTIONS_EMULATOR === "true";

/** Shared options for every customer-facing callable. */
export const callableOptions: CallableOptions = {
  region: REGION,
  enforceAppCheck: !emulated,
  secrets: [RAZORPAY_KEY_SECRET],
};

export const razorpay = () =>
  new Razorpay({ key_id: RAZORPAY_KEY_ID.value(), key_secret: RAZORPAY_KEY_SECRET.value() });

/** Maps domain errors to HttpsError; anything unexpected becomes an opaque internal error. */
export function toHttpsError(e: unknown): HttpsError {
  if (e instanceof HttpsError) return e;
  if (e instanceof OrderError) return new HttpsError(e.code, e.message);
  console.error(e);
  return new HttpsError("internal", "Something went wrong. Please try again.");
}

export function requireAuth(uid: string | undefined): string {
  if (!uid) throw new HttpsError("unauthenticated", "Please sign in to continue.");
  return uid;
}

export function requireAdmin(token: Record<string, unknown> | undefined) {
  if (token?.admin !== true) throw new HttpsError("permission-denied", "Admin access required.");
}
