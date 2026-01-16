import crypto from "crypto";

export const SESSION_COOKIE = "dashboard_session";

function getSecret() {
  return process.env.DASHBOARD_AUTH_SECRET || process.env.DASHBOARD_PASSWORD;
}

export function getSessionTtlMs() {
  const ttl = Number.parseInt(process.env.DASHBOARD_SESSION_TTL_SEC || "86400", 10);
  return Number.isFinite(ttl) ? ttl * 1000 : 86_400_000;
}

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createSessionToken() {
  const secret = getSecret();
  if (!secret) return null;
  const payload = `${Date.now()}.${crypto.randomBytes(12).toString("hex")}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest();
  return `${payload}.${toBase64Url(signature)}`;
}

export function verifySessionToken(token) {
  const secret = getSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [timestamp, nonce, signature] = parts;
  const payload = `${timestamp}.${nonce}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest();
  const expectedSig = toBase64Url(expected);
  if (!timingSafeEqual(signature, expectedSig)) return false;
  const issued = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(issued)) return false;
  return Date.now() - issued <= getSessionTtlMs();
}
