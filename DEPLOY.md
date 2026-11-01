# Deploying KAMELEON

## 1. Firebase project
1. Create a project (Blaze plan, required for Cloud Functions and outbound Razorpay calls).
2. Enable **Authentication** (Email/Password and Google), **Firestore** (asia-south1), **Storage**, **Cloud Messaging**.
3. Add your production domain under Authentication > Settings > Authorized domains.
4. **App Check**: register a reCAPTCHA v3 site, then enable enforcement for Cloud Functions, Firestore and Storage in the console. Put the site key in `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`. The functions already require App Check outside the emulator, so checkout fails until the browser has a key.

## 2. Backend
```bash
firebase use <project-id>
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
echo "RAZORPAY_KEY_ID=rzp_live_xxx" > functions/.env.<project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage,functions
```
Indexes take a few minutes to build; order lists and the reservation sweep need them.

## 3. Razorpay
- Use **test** keys first. Add a webhook pointing to `https://asia-south1-<project-id>.cloudfunctions.net/razorpayWebhook` with the same secret you set above, and the events `payment.captured`, `order.paid` and `payment.failed`.
- Do one full test payment, then a partial and a full refund from the admin dashboard, before switching to live keys.

## 4. First admin and sample data
```bash
export GOOGLE_APPLICATION_CREDENTIALS=service-account.json GCLOUD_PROJECT=<project-id>
node scripts/make-admin.mjs owner@example.com          # then sign out and back in
node --experimental-strip-types scripts/seed.mjs       # optional sample catalogue
```
Keep the service-account file out of git and out of the web app.

## 5. Web app (e.g. Vercel)
Set these **before building**, because `NEXT_PUBLIC_*` values are baked in at build time:
`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `NEXT_PUBLIC_SITE_URL` (used for sitemap, canonical and Open Graph URLs). Never set `NEXT_PUBLIC_USE_EMULATORS` in production.

## 6. Before launch
- Replace the draft policy text (privacy, terms, shipping, returns) after legal review, and fill in contact details under Admin > Store content.
- Upload product photography; until then products show a placeholder.
- Check `/sitemap.xml` and `/robots.txt` on the live domain.

## Known limits
- No Content-Security-Policy header yet. Razorpay, Firebase and reCAPTCHA need several origins; add one in report-only mode first.
- `previewCoupon` is not rate limited, so a signed-in user could probe coupon codes. Add per-user throttling if codes are guessable.
- Admin overview totals read the whole orders collection; switch to stored aggregates once volume grows.
- Email confirmations are not built; customers get push notifications and the order page.
