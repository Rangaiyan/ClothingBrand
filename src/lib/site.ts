// `||` rather than `??` so an empty NEXT_PUBLIC_SITE_URL= line in .env still falls back.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
