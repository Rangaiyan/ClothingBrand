import test from "node:test";
import assert from "node:assert/strict";
import { priceOrder, type CatalogVariant } from "./pricing";
import { couponDiscount, type Coupon } from "../coupons/calc";
import { applyStockDeltas } from "../inventory/stock";
import { verifyCheckoutSignature, verifyWebhookSignature } from "../payments/signature";
import { createHmac } from "node:crypto";

const now = new Date("2026-11-01T00:00:00Z");
const catalog: Record<string, CatalogVariant> = {
  A: { productId: "p1", sku: "A", name: "Vesti", colour: "White", size: "Free Size", price: 1000, stock: 5 },
  B: { productId: "p2", sku: "B", name: "Lungi", colour: "Navy", size: "Free Size", price: 700, stock: 1 },
};
const lookup = (_p: string, sku: string) => catalog[sku];
const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  code: "SAVE", type: "percent", value: 10, usedCount: 0, active: true, ...over,
});

test("prices from catalogue and adds flat shipping under threshold", () => {
  const o = priceOrder([{ productId: "p1", sku: "A", qty: 1 }], lookup, undefined, now);
  assert.deepEqual([o.subtotal, o.shipping, o.total], [1000, 99, 1099]);
});

test("free shipping at threshold and duplicate lines merge", () => {
  const o = priceOrder(
    [{ productId: "p1", sku: "A", qty: 1 }, { productId: "p1", sku: "A", qty: 1 }],
    lookup, undefined, now,
  );
  assert.equal(o.lines.length, 1);
  assert.deepEqual([o.subtotal, o.shipping, o.total], [2000, 0, 2000]);
});

test("rejects over-stock, unknown sku and bad quantities", () => {
  assert.throws(() => priceOrder([{ productId: "p2", sku: "B", qty: 2 }], lookup, undefined, now), /Only 1 left/);
  assert.throws(() => priceOrder([{ productId: "p9", sku: "Z", qty: 1 }], lookup, undefined, now), /no longer available/);
  assert.throws(() => priceOrder([{ productId: "p1", sku: "A", qty: 0 }], lookup, undefined, now), /Invalid quantity/);
  assert.throws(() => priceOrder([{ productId: "p1", sku: "A", qty: 11 }], lookup, undefined, now), /at most/);
  assert.throws(() => priceOrder([], lookup, undefined, now), /empty/);
});

test("percent coupon applies, respects max discount and total", () => {
  const o = priceOrder([{ productId: "p1", sku: "A", qty: 2 }], lookup, { coupon: coupon({ maxDiscount: 150 }), userUses: 0 }, now);
  assert.equal(o.discount, 150);
  assert.equal(o.total, 2000 - 150);
});

test("coupon guards: inactive, expired, limits, minimum", () => {
  const d = (c: Coupon, sub = 1000, uses = 0) => () => couponDiscount(c, sub, uses, now);
  assert.throws(d(coupon({ active: false })), /not active/);
  assert.throws(d(coupon({ expiresAt: new Date("2026-10-31") })), /expired/);
  assert.throws(d(coupon({ usageLimit: 3, usedCount: 3 })), /usage limit/);
  assert.throws(d(coupon({ perUserLimit: 1 }), 1000, 1), /already used/);
  assert.throws(d(coupon({ minOrder: 2000 })), /Minimum order/);
  assert.equal(couponDiscount(coupon({ type: "fixed", value: 5000 }), 1000, 0, now), 1000);
});

test("stock deltas never go negative and do not mutate input", () => {
  const v = [{ sku: "A", stock: 2 }];
  assert.equal(applyStockDeltas(v, [{ sku: "A", delta: -2 }])[0].stock, 0);
  assert.equal(v[0].stock, 2);
  assert.throws(() => applyStockDeltas(v, [{ sku: "A", delta: -3 }]), /Not enough stock/);
  assert.throws(() => applyStockDeltas(v, [{ sku: "X", delta: 1 }]), /Unknown SKU/);
});

test("signatures verify and reject tampering", () => {
  const sig = createHmac("sha256", "secret").update("order_1|pay_1").digest("hex");
  assert.ok(verifyCheckoutSignature("order_1", "pay_1", sig, "secret"));
  assert.ok(!verifyCheckoutSignature("order_1", "pay_2", sig, "secret"));
  assert.ok(!verifyCheckoutSignature("order_1", "pay_1", "short", "secret"));
  const body = Buffer.from('{"event":"payment.captured"}');
  const wsig = createHmac("sha256", "whsec").update(body).digest("hex");
  assert.ok(verifyWebhookSignature(body, wsig, "whsec"));
  assert.ok(!verifyWebhookSignature(body, wsig, "other"));
});
